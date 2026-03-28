import { Resend } from 'resend';

const resend = new Resend('re_ceNWkL8M_A2NkZ9pSeoSns5nMNBXPYCG5');

const result = await resend.emails.send({
  from: 'onboarding@resend.dev',
  to: ['maxi.erramouspe77@gmail.com'],
  subject: 'Test POS',
  html: '<p>Esto es una prueba 🔥</p>',
});

console.log(JSON.stringify(result, null, 2));
