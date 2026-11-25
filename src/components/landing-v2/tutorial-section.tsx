import { VideoTutorials } from "./video-tutorials";
import { CheckCircle2, Clock3, GraduationCap, PlayCircle, Zap } from "lucide-react";

export function TutorialSection() {
  return <section className="lp-section lp-tutorials" id="tutoriales"><div className="lp-wrap"><div className="lp-tutorial-hero"><div className="lp-tutorial-brand"><span><PlayCircle aria-hidden="true" /></span><div><small>Centro de ayuda Tienda360</small><h2>Videotutoriales</h2><p>Aprendé a configurar y usar el sistema paso a paso.</p></div></div><div className="lp-tutorial-help"><GraduationCap aria-hidden="true" /><span><strong>Centro de Ayuda</strong><small>Guías · Videos · Preguntas</small></span></div><div className="lp-tutorial-promises"><span><Zap aria-hidden="true" /><b>Paso a paso<small>Tutoriales claros y prácticos</small></b></span><span><Clock3 aria-hidden="true" /><b>Cortos y directos<small>Aprendé en pocos minutos</small></b></span><span><CheckCircle2 aria-hidden="true" /><b>Desde cero<small>Ideal para nuevos usuarios</small></b></span></div></div><VideoTutorials /></div></section>;
}
