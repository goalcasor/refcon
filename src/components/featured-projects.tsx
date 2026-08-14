import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import placeholderImages from '@/lib/placeholder-images.json';

const STORAGE =
  'https://firebasestorage.googleapis.com/v0/b/amparo-aesthetics.firebasestorage.app/o/refcon%2Fvideo';

const img = (id: string) => placeholderImages.placeholderImages.find((p) => p.id === id);

/**
 * Mosaico de proyectos destacados, compartido por la home y las landings.
 *
 * Estaba embebido en la home; se extrae para que las landings muestren la misma
 * prueba visual sin duplicar el marcado ni la lista de medios.
 */
export function FeaturedProjects({
  t,
  ctaHref = '/budget-request',
}: {
  /** Bloque `home.projects` del diccionario. */
  t: any;
  /** Destino de la tarjeta de llamada a la acción del mosaico. */
  ctaHref?: string;
}) {
  const project1 = img('project-1');
  const project2 = img('project-2');
  const project3 = img('project-3');

  const projects = [
    { type: 'image', title: t.project1.title, category: t.project1.category, src: project1?.imageUrl, imageHint: project1?.imageHint, className: 'md:col-span-2 md:row-span-2' },
    { type: 'video', title: t.project4.title, category: t.project4.category, src: `${STORAGE}%2Ffreepik__dolly-shot-a-serene-bathroom-scene-transitions-fro__5956.mp4?alt=media&token=76a12f63-d80b-44e4-8831-5cb538a8391b`, imageHint: 'modern bathroom renovation', className: 'md:col-span-1 md:row-span-2' },
    { type: 'image', title: t.project3.title, category: t.project3.category, src: project3?.imageUrl, imageHint: project3?.imageHint, className: 'md:col-span-1 md:row-span-1' },
    { type: 'image', title: t.project2.title, category: t.project2.category, src: project2?.imageUrl, imageHint: project2?.imageHint, className: 'md:col-span-1 md:row-span-1' },
    { type: 'video', title: t.project5.title, category: t.project5.category, src: `${STORAGE}%2Ffreepik__dolly-shot-transition-from-a-cluttered-outdated-ki__5958.mp4?alt=media&token=8157e8bc-e7b3-4641-8368-0d4f6c05de80`, imageHint: 'elegant kitchen remodel', className: 'md:col-span-2 md:row-span-2' },
    { type: 'video', title: t.project6.title, category: t.project6.category, src: `${STORAGE}%2Fidea%20ban%CC%83o%202.mp4?alt=media&token=2fcd0a78-db39-4245-b6ae-6efbdd5d74fb`, imageHint: 'bathroom idea', className: 'md:col-span-2 md:row-span-1' },
    { type: 'cta', title: t.cta.title, subtitle: t.cta.subtitle, buttonText: t.cta.button, href: ctaHref, className: 'md:col-span-1 md:row-span-1' },
    { type: 'video', title: t.project7.title, category: t.project7.category, src: `${STORAGE}%2Fidea%20ban%CC%83o.mp4?alt=media&token=2efab321-8534-4815-b50c-e5f934c2db08`, imageHint: 'bathroom idea 2', className: 'md:col-span-1 md:row-span-1' },
    { type: 'video', title: t.project8.title, category: t.project8.category, src: `${STORAGE}%2Fidea%20terraza.mp4?alt=media&token=66ba634f-c712-4531-b31d-4f4e1fe5cee2`, imageHint: 'terrace idea', className: 'md:col-span-2 md:row-span-1' },
    { type: 'video', title: t.project9.title, category: t.project9.category, src: `${STORAGE}%2Fjardineria.antes-y-despu%C3%A9s.mp4?alt=media&token=bf01f81f-6490-46e3-9d9a-613c1427523b`, imageHint: 'gardening before after', className: 'md:col-span-1 md:row-span-1' },
    { type: 'video', title: t.project10.title, category: t.project10.category, src: `${STORAGE}%2Ffreepik__a-cinematic-journey-unfolds-as-we-transition-from-__78739.mp4?alt=media&token=a9e05a13-a915-4b43-8b39-8c2c0bcc952e`, imageHint: 'house facade', className: 'md:col-span-1 md:row-span-1' },
  ];

  return (
    <div className="grid auto-rows-[15rem] grid-cols-2 gap-2 overflow-hidden rounded-lg md:auto-rows-[12rem] md:grid-cols-4">
      {projects.map((project, index) => (
        <Card
          key={index}
          className={cn(
            'group relative overflow-hidden transition-all duration-300 hover:z-10 hover:scale-[1.02]',
            project.type === 'cta' && 'col-span-2',
            project.className
          )}
        >
          {project.type === 'cta' ? (
            <Link
              href={project.href || '#'}
              className="flex h-full flex-col items-center justify-center bg-background/80 p-8 text-center backdrop-blur-sm transition-colors hover:bg-background"
            >
              <ArrowRight className="mb-4 h-10 w-10 text-primary transition-transform group-hover:scale-110" />
              <h3 className="text-xl font-bold md:text-2xl">{project.title}</h3>
              <p className="mt-2 text-base text-muted-foreground">{project.subtitle}</p>
              <Button variant="link" className="mt-4 text-primary hover:text-primary/80">
                {project.buttonText}
              </Button>
            </Link>
          ) : (
            <div className="relative h-full w-full">
              {project.type === 'image'
                ? project.src && (
                    <Image
                      src={project.src}
                      alt={project.title || 'Project image'}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      data-ai-hint={project.imageHint}
                    />
                  )
                : project.src && (
                    <video
                      src={project.src}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="video-cover h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      data-ai-hint={project.imageHint}
                    />
                  )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-4 left-4 p-2 text-white">
                <h3 className="text-base font-bold">{project.title}</h3>
                <p className="text-xs opacity-90">{project.category}</p>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
