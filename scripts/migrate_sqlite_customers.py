import argparse
import json
import os
import sqlite3
import sys
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"
MIGRATION_NOTE = "Migracion saldo inicial SQLite"
MIGRATION_PAYMENT_NOTE = "Migracion saldo a favor SQLite"
MAX_NUMERIC_12_2 = Decimal("9999999999.99")


@dataclass
class CustomerBalanceRow:
    sqlite_client_id: int
    name: str
    phone: str | None
    email: str | None
    credit_limit: Decimal
    balance: Decimal
    adjustments_vs_payments: Decimal


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        return env
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip()
    return env


def env_value(key: str, env_file: dict[str, str]) -> str:
    value = os.environ.get(key) or env_file.get(key)
    if not value:
        raise RuntimeError(f"Missing required env var: {key}")
    return value


def normalize_text(value: str | None) -> str | None:
    if value is None:
        return None
    compact = " ".join(value.split()).strip()
    return compact or None


def to_decimal(value: float | int | str | None) -> Decimal:
    try:
        return Decimal(str(value or 0)).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError) as exc:
        raise RuntimeError(f"Invalid numeric value: {value!r}") from exc


def safe_credit_limit(credit_limit: Decimal, balance: Decimal) -> Decimal:
    if credit_limit <= Decimal("0.00"):
        return Decimal("0.00")
    normalized = min(credit_limit, MAX_NUMERIC_12_2)
    if balance > Decimal("0.00") and normalized < balance:
        normalized = min(MAX_NUMERIC_12_2, balance)
    return normalized.quantize(Decimal("0.01"))


def supabase_request(url: str, api_key: str, method: str = "GET", body: object | None = None) -> list[dict]:
    data = None
    headers = {
        "apikey": api_key,
        "Authorization": f"Bearer {api_key}",
    }
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
        headers["Prefer"] = "return=representation"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            payload = resp.read().decode("utf-8")
            return json.loads(payload) if payload else []
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Supabase HTTP {exc.code}: {detail}") from exc


def sqlite_customer_balances(sqlite_path: Path) -> list[CustomerBalanceRow]:
    conn = sqlite3.connect(sqlite_path)
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute(
            """
            select
              c.id as sqlite_client_id,
              c.name,
              c.phone,
              c.email,
              c.credit_limit,
              coalesce((
                select sum(
                  case
                    when cl.kind = 'DEBIT' then cl.amount
                    when cl.kind = 'CREDIT' then -cl.amount
                    else cl.amount
                  end
                )
                from client_ledger cl
                where cl.client_id = c.id
              ), 0) as balance,
              coalesce((
                select sum(amount) from client_ledger where client_id = c.id and kind = 'CREDIT'
              ), 0)
              -
              coalesce((
                select sum(amount) from client_payments where client_id = c.id
              ), 0) as adjustments_vs_payments
            from clients c
            where c.is_active = 1
            order by c.name asc
            """
        ).fetchall()
    finally:
        conn.close()
    result: list[CustomerBalanceRow] = []
    for row in rows:
        result.append(
            CustomerBalanceRow(
                sqlite_client_id=int(row["sqlite_client_id"]),
                name=str(row["name"]),
                phone=normalize_text(row["phone"]),
                email=normalize_text(row["email"]),
                credit_limit=to_decimal(row["credit_limit"]),
                balance=to_decimal(row["balance"]),
                adjustments_vs_payments=to_decimal(row["adjustments_vs_payments"]),
            )
        )
    return result


def fetch_existing_customers(base_url: str, api_key: str, business_id: str) -> list[dict]:
    params = urllib.parse.urlencode(
        {
            "business_id": f"eq.{business_id}",
            "select": "id,name,phone,email,credit_limit",
            "limit": "5000",
        }
    )
    return supabase_request(f"{base_url}/rest/v1/business_customers?{params}", api_key)


def fetch_existing_seed_sales(base_url: str, api_key: str, business_id: str) -> list[dict]:
    params = urllib.parse.urlencode(
        {
            "business_id": f"eq.{business_id}",
            "payment_method": "eq.cuenta_corriente",
            "select": "id,customer_id,total,payment_details",
            "limit": "5000",
        }
    )
    rows = supabase_request(f"{base_url}/rest/v1/sales?{params}", api_key)
    return [row for row in rows if isinstance(row.get("payment_details"), dict) and row["payment_details"].get("source") == "sqlite_initial_balance"]


def fetch_existing_seed_payments(base_url: str, api_key: str, business_id: str) -> list[dict]:
    params = urllib.parse.urlencode(
        {
            "business_id": f"eq.{business_id}",
            "select": "id,customer_id,amount,notes",
            "limit": "5000",
        }
    )
    rows = supabase_request(f"{base_url}/rest/v1/customer_account_payments?{params}", api_key)
    return [row for row in rows if normalize_text(row.get("notes")) == MIGRATION_PAYMENT_NOTE]


def customer_key(name: str | None, phone: str | None) -> tuple[str, str]:
    return (normalize_text(name) or "").lower(), normalize_text(phone) or ""


def insert_customer(base_url: str, api_key: str, business_id: str, row: CustomerBalanceRow) -> dict:
    normalized_credit_limit = safe_credit_limit(row.credit_limit, row.balance)
    body = {
        "business_id": business_id,
        "name": normalize_text(row.name),
        "phone": row.phone,
        "email": row.email,
        "credit_limit": str(normalized_credit_limit),
    }
    created = supabase_request(f"{base_url}/rest/v1/business_customers", api_key, method="POST", body=body)
    if not created:
        raise RuntimeError(f"Failed to create customer: {row.name}")
    return created[0]


def insert_seed_sale(base_url: str, api_key: str, business_id: str, customer_id: str, row: CustomerBalanceRow) -> dict:
    sale_body = {
        "business_id": business_id,
        "total": str(row.balance),
        "payment_method": "cuenta_corriente",
        "payment_details": {
            "source": "sqlite_initial_balance",
            "sqlite_client_id": row.sqlite_client_id,
            "note": MIGRATION_NOTE,
        },
        "status": "paid",
        "customer_id": customer_id,
    }
    sale = supabase_request(f"{base_url}/rest/v1/sales", api_key, method="POST", body=sale_body)
    if not sale:
        raise RuntimeError(f"Failed to create seed sale for {row.name}")
    sale_id = sale[0]["id"]
    item_body = {
        "business_id": business_id,
        "sale_id": sale_id,
        "product_id": None,
        "name": MIGRATION_NOTE,
        "quantity": "1.000",
        "unit_price": str(row.balance),
        "total": str(row.balance),
    }
    supabase_request(f"{base_url}/rest/v1/sale_items", api_key, method="POST", body=item_body)
    return sale[0]


def insert_seed_payment(base_url: str, api_key: str, business_id: str, customer_id: str, amount: Decimal, sqlite_client_id: int) -> dict:
    body = {
        "business_id": business_id,
        "customer_id": customer_id,
        "amount": str(abs(amount)),
        "payment_method": "cash",
        "payment_details": {"source": "sqlite_initial_balance", "sqlite_client_id": sqlite_client_id},
        "notes": MIGRATION_PAYMENT_NOTE,
    }
    created = supabase_request(f"{base_url}/rest/v1/customer_account_payments", api_key, method="POST", body=body)
    if not created:
        raise RuntimeError(f"Failed to create seed payment for sqlite client {sqlite_client_id}")
    return created[0]


def main() -> int:
    parser = argparse.ArgumentParser(description="Migrate SQLite clients and their initial balances into Supabase.")
    parser.add_argument("--sqlite", default="db gika/pos_2026-06-20_132438.sqlite3", help="SQLite database path")
    parser.add_argument("--business-id", required=True, help="Target Supabase business_id")
    parser.add_argument("--apply", action="store_true", help="Actually insert missing customers and seed balances")
    args = parser.parse_args()

    env_file = load_env(ENV_PATH)
    supabase_url = env_value("NEXT_PUBLIC_SUPABASE_URL", env_file).rstrip("/")
    service_role_key = env_value("SUPABASE_SERVICE_ROLE_KEY", env_file)
    sqlite_path = (ROOT / args.sqlite).resolve()
    if not sqlite_path.exists():
        raise RuntimeError(f"SQLite file not found: {sqlite_path}")

    sqlite_rows = sqlite_customer_balances(sqlite_path)
    existing_customers = fetch_existing_customers(supabase_url, service_role_key, args.business_id)
    existing_sales = fetch_existing_seed_sales(supabase_url, service_role_key, args.business_id)
    existing_payments = fetch_existing_seed_payments(supabase_url, service_role_key, args.business_id)

    customer_map = {customer_key(row.get("name"), row.get("phone")): row for row in existing_customers}
    seeded_sale_customer_ids = {str(row.get("customer_id")) for row in existing_sales}
    seeded_payment_customer_ids = {str(row.get("customer_id")) for row in existing_payments}

    summary_rows: list[dict[str, object]] = []
    created_customers = 0
    created_sales = 0
    created_payments = 0

    for row in sqlite_rows:
        key = customer_key(row.name, row.phone)
        customer = customer_map.get(key)
        customer_created = False
        if not customer and args.apply:
            customer = insert_customer(supabase_url, service_role_key, args.business_id, row)
            customer_map[key] = customer
            customer_created = True
            created_customers += 1

        customer_id = str(customer["id"]) if customer else None
        action = "none"
        if row.balance > Decimal("0.00"):
            action = "seed_sale"
            if args.apply and customer_id and customer_id not in seeded_sale_customer_ids:
                insert_seed_sale(supabase_url, service_role_key, args.business_id, customer_id, row)
                seeded_sale_customer_ids.add(customer_id)
                created_sales += 1
        elif row.balance < Decimal("0.00"):
            action = "seed_payment"
            if args.apply and customer_id and customer_id not in seeded_payment_customer_ids:
                insert_seed_payment(supabase_url, service_role_key, args.business_id, customer_id, row.balance, row.sqlite_client_id)
                seeded_payment_customer_ids.add(customer_id)
                created_payments += 1

        summary_rows.append(
            {
                "sqlite_client_id": row.sqlite_client_id,
                "name": row.name,
                "phone": row.phone,
                "credit_limit": str(row.credit_limit),
                "credit_limit_normalized": str(safe_credit_limit(row.credit_limit, row.balance)),
                "balance": str(row.balance),
                "adjustments_vs_payments": str(row.adjustments_vs_payments),
                "customer_exists": bool(customer),
                "customer_created": customer_created,
                "action": action,
            }
        )

    summary = {
        "sqlite_active_customers": len(sqlite_rows),
        "existing_supabase_customers": len(existing_customers),
        "seed_sales_already_present": len(existing_sales),
        "seed_payments_already_present": len(existing_payments),
        "apply": args.apply,
        "created_customers": created_customers,
        "created_seed_sales": created_sales,
        "created_seed_payments": created_payments,
        "rows": summary_rows,
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        raise SystemExit(1)
