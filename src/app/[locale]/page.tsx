

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight, Star, Award, ShieldCheck, HeartHandshake, Search, DraftingCompass, Hammer, Check, Quote } from 'lucide-react';
import { services } from '@/lib/services';
import placeholderImages from '@/lib/placeholder-images.json';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getDictionary } from '@/lib/dictionaries';
import { cn } from '@/lib/utils';

export default async function Home({ params: { locale } }: { params: { locale: any } }) {
  const dict = await getDictionary(locale);
  const heroImage = placeholderImages.placeholderImages.find(p => p.id === 'hero-construction');
  const aboutImage = placeholderImages.placeholderImages.find(p => p.id === 'about-us-image');
  const project1Image = placeholderImages.placeholderImages.find(p => p.id === 'project-1');
  const project2Image = placeholderImages.placeholderImages.find(p => p.id === 'project-2');
  const project3Image = placeholderImages.placeholderImages.find(p_ => p_.id === 'project-3');
  const t = dict.home;
  const t_services = dict.services;

  const whyChooseUs = [
    { text: t.about.reason1, icon: <Award className="w-8 h-8 mb-2 text-primary" /> },
    { text: t.about.reason2, icon: <ShieldCheck className="w-8 h-8 mb-2 text-primary" /> },
    { text: t.about.reason3, icon: <HeartHandshake className="w-8 h-8 mb-2 text-primary" /> },
  ];

  const processSteps = [
    { title: t.process.step1.title, description: t.process.step1.description, icon: <Search className="w-10 h-10 mb-4 text-primary" /> },
    { title: t.process.step2.title, description: t.process.step2.description, icon: <DraftingCompass className="w-10 h-10 mb-4 text-primary" /> },
    { title: t.process.step3.title, description: t.process.step3.description, icon: <Hammer className="w-10 h-10 mb-4 text-primary" /> },
    { title: t.process.step4.title, description: t.process.step4.description, icon: <Check className="w-10 h-10 mb-4 text-primary" /> },
  ];
  
  const featuredProjects = [
    { 
      type: 'image',
      title: t.projects.project1.title,
      category: t.projects.project1.category,
      src: project1Image?.imageUrl,
      imageHint: project1Image?.imageHint,
      className: 'md:col-span-2 md:row-span-2',
    },
    { 
      type: 'video',
      title: t.projects.project4.title,
      category: t.projects.project4.category,
      src: 'https://firebasestorage.googleapis.com/v0/b/amparo-aesthetics.firebasestorage.app/o/refcon%2Fvideo%2Ffreepik__dolly-shot-a-serene-bathroom-scene-transitions-fro__5956.mp4?alt=media&token=76a12f63-d80b-44e4-8831-5cb538a8391b',
      imageHint: 'modern bathroom renovation',
      className: 'md:col-span-1 md:row-span-2',
    },
    { 
      type: 'image',
      title: t.projects.project3.title,
      category: t.projects.project3.category,
      src: project3Image?.imageUrl,
      imageHint: project3Image?.imageHint,
      className: 'md:col-span-1 md:row-span-1',
    },
    { 
      type: 'image',
      title: t.projects.project2.title,
      category: t.projects.project2.category,
      src: project2Image?.imageUrl,
      imageHint: project2Image?.imageHint,
      className: 'md:col-span-1 md:row-span-1',
    },
    { 
      type: 'video',
      title: t.projects.project5.title,
      category: t.projects.project5.category,
      src: 'https://firebasestorage.googleapis.com/v0/b/amparo-aesthetics.firebasestorage.app/o/refcon%2Fvideo%2Ffreepik__dolly-shot-transition-from-a-cluttered-outdated-ki__5958.mp4?alt=media&token=8157e8bc-e7b3-4641-8368-0d4f6c05de80',
      imageHint: 'elegant kitchen remodel',
      className: 'md:col-span-2 md:row-span-2',
    },
    { 
      type: 'video',
      title: t.projects.project6.title,
      category: t.projects.project6.category,
      src: 'https://firebasestorage.googleapis.com/v0/b/amparo-aesthetics.firebasestorage.app/o/refcon%2Fvideo%2Fidea%20ban%CC%83o%202.mp4?alt=media&token=2fcd0a78-db39-4245-b6ae-6efbdd5d74fb',
      imageHint: 'bathroom idea',
      className: 'md:col-span-2 md:row-span-1',
    },
    { 
      type: 'cta',
      title: t.projects.cta.title,
      subtitle: t.projects.cta.subtitle,
      buttonText: t.projects.cta.button,
      href: '/budget-request',
      className: 'md:col-span-1 md:row-span-1',
    },
    { 
      type: 'video',
      title: t.projects.project7.title,
      category: t.projects.project7.category,
      src: 'https://firebasestorage.googleapis.com/v0/b/amparo-aesthetics.firebasestorage.app/o/refcon%2Fvideo%2Fidea%20ban%CC%83o.mp4?alt=media&token=2efab321-8534-4815-b50c-e5f934c2db08',
      imageHint: 'bathroom idea 2',
      className: 'md:col-span-1 md:row-span-1',
    },
    { 
      type: 'video',
      title: t.projects.project8.title,
      category: t.projects.project8.category,
      src: 'https://firebasestorage.googleapis.com/v0/b/amparo-aesthetics.firebasestorage.app/o/refcon%2Fvideo%2Fidea%20terraza.mp4?alt=media&token=66ba634f-c712-4531-b31d-4f4e1fe5cee2',
      imageHint: 'terrace idea',
      className: 'md:col-span-2 md:row-span-1',
    },
    { 
      type: 'video',
      title: t.projects.project9.title,
      category: t.projects.project9.category,
      src: 'https://firebasestorage.googleapis.com/v0/b/amparo-aesthetics.firebasestorage.app/o/refcon%2Fvideo%2Fjardineria.antes-y-despu%C3%A9s.mp4?alt=media&token=bf01f81f-6490-46e3-9d9a-613c1427523b',
      imageHint: 'gardening before after',
      className: 'md:col-span-1 md:row-span-1',
    },
    {
      type: 'video',
      title: t.projects.project10.title,
      category: t.projects.project10.category,
      src: 'https://firebasestorage.googleapis.com/v0/b/amparo-aesthetics.firebasestorage.app/o/refcon%2Fvideo%2Ffreepik__a-cinematic-journey-unfolds-as-we-transition-from-__78739.mp4?alt=media&token=a9e05a13-a915-4b43-8b39-8c2c0bcc952e',
      imageHint: 'house facade',
      className: 'md:col-span-1 md:row-span-1',
    }
  ];

  const testimonials = [
    {
        quote: t.testimonials.testimonial2,
        name: t.testimonials.customer2,
        project: t.testimonials.project,
    },
    {
        quote: t.testimonials.testimonial3,
        name: t.testimonials.customer3,
        project: t.testimonials.project,
    }
  ];

  return (
    <>
      <Header t={dict} />
      <main className="flex-1">
        <section className="relative w-full py-20 md:py-24 lg:py-28 bg-secondary/50">
          <div className="container-limited grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                {t.hero.title}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                {t.hero.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="font-bold cta-pulse">
                  <Link href="/budget-request">
                    {t.hero.cta}
                    <ArrowRight className="ml-2" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="#services">{t.hero.ctaSecondary}</Link>
                </Button>
              </div>
            </div>
            <div className="relative h-64 md:h-auto md:aspect-square rounded-xl shadow-2xl overflow-hidden">
             {heroImage && <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                className="object-cover"
                data-ai-hint={heroImage.imageHint}
              />}
            </div>
          </div>
        </section>

        <section id="services" className="w-full py-20 md:py-28 bg-background">
          <div className="container-limited">
            <div className="text-center space-y-4 mb-12">
              <h2 className="font-headline text-3xl md:text-4xl font-bold">{t.services.title}</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                {t.services.subtitle}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => {
                const serviceTranslation = t_services[service.id];
                return (
                  <Card key={service.id} className="group overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-300">
                    <div className="relative h-48 w-full">
                      <Image
                        src={service.image}
                        alt={serviceTranslation.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={service.imageHint}
                      />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                       <div className="absolute bottom-4 left-4 text-white">
                          <div className="bg-primary/80 text-primary-foreground p-3 rounded-full mb-2 w-fit">
                              {service.icon}
                          </div>
                          <h3 className="font-headline text-2xl font-bold">{serviceTranslation.title}</h3>
                       </div>
                    </div>
                    <CardContent className="p-6 flex-grow flex flex-col">
                      <p className="flex-grow text-muted-foreground">{serviceTranslation.shortDescription}</p>
                      <Button asChild variant="link" className="p-0 h-auto mt-4 self-start">
                          <Link href={`/services/${service.id}`} className="font-bold">
                              {t.services.detailsButton} <ArrowRight className="ml-2" />
                          </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            <div className="text-center mt-16">
              <Button asChild size="lg">
                <Link href="/budget-request">
                  {t.hero.cta} <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="about" className="w-full py-20 md:py-28 bg-secondary/50">
          <div className="container-limited grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="font-headline text-3xl md:text-4xl font-bold">{t.about.title}</h2>
              <p className="text-muted-foreground leading-relaxed">{t.about.description1}</p>
              <p className="text-muted-foreground leading-relaxed">{t.about.description2}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                {whyChooseUs.map((reason, index) => (
                  <div key={index} className="text-center p-4">
                    <div className="flex justify-center">
                      {reason.icon}
                    </div>
                    <p className="font-semibold">{reason.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative h-80 md:h-auto md:aspect-square rounded-xl shadow-2xl overflow-hidden">
              {aboutImage && <Image
                  src={aboutImage.imageUrl}
                  alt={aboutImage.description}
                  fill
                  className="object-cover"
                  data-ai-hint={aboutImage.imageHint}
              />}
            </div>
          </div>
        </section>

        <section id="process" className="w-full py-20 md:py-28 bg-background">
          <div className="container-limited">
            <div className="text-center space-y-4 mb-12">
              <h2 className="font-headline text-3xl md:text-4xl font-bold">{t.process.title}</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">{t.process.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {processSteps.map((step, index) => (
                <div key={index} className="relative flex flex-col items-center text-center p-6 border rounded-lg bg-secondary/30">
                  <div className="absolute -top-4 -right-2 bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="mb-4">
                    {step.icon}
                  </div>
                  <h3 className="font-headline text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-16">
                <h3 className="font-headline text-2xl font-bold">{t.process.cta.title}</h3>
                <p className="text-muted-foreground mt-2 mb-6">{t.process.cta.subtitle}</p>
                <Button asChild size="lg">
                    <Link href="/budget-request">
                        {t.hero.cta} <ArrowRight className="ml-2" />
                    </Link>
                </Button>
            </div>
          </div>
        </section>
            
        <section id="projects" className="w-full py-20 md:py-28 bg-secondary">
          <div className="container-limited">
            <div className="text-center space-y-4 mb-12">
              <h2 className="font-headline text-3xl md:text-4xl font-bold">{t.projects.title}</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">{t.projects.subtitle}</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[15rem] md:auto-rows-[12rem] gap-2 rounded-lg overflow-hidden">
              {featuredProjects.map((project, index) => (
                <Card key={index} 
                  className={cn(
                    "group overflow-hidden relative transition-all duration-300 transform hover:scale-[1.02] hover:z-10",
                    project.type === 'cta' && 'col-span-2',
                    project.className
                  )}
                >
                  {project.type === 'cta' ? (
                    <Link href={project.href || '#'} className="h-full flex flex-col justify-center items-center bg-background/80 backdrop-blur-sm hover:bg-background transition-colors p-8 text-center">
                      <ArrowRight className="w-10 h-10 mb-4 text-primary group-hover:scale-110 transition-transform" />
                      <h3 className="text-xl md:text-2xl font-bold">{project.title}</h3> 
                      <p className="text-base text-muted-foreground mt-2">{project.subtitle}</p>
                      <Button variant="link" className="mt-4 text-primary hover:text-primary/80">{project.buttonText}</Button>
                    </Link>
                  ) : (
                    <div className="relative h-full w-full">
                      {project.type === 'image' ? (
                        project.src && <Image
                          src={project.src}
                          alt={project.title || 'Project image'}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          data-ai-hint={project.imageHint}
                        />
                      ) : (
                        project.src && <video
                          src={project.src}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="h-full w-full object-cover video-cover transition-transform duration-500 group-hover:scale-110"
                          data-ai-hint={project.imageHint}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-4 left-4 text-white p-2">
                        <h3 className="font-bold text-base">{project.title}</h3>
                        <p className="text-xs opacity-90">{project.category}</p>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="relative w-full bg-background pt-20 md:pt-28">
            <div className="absolute top-0 left-0 w-full overflow-hidden leading-none rotate-180">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block h-[60px] md:h-[100px] w-[calc(100%+1.3px)]">
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-secondary"></path>
                </svg>
            </div>
            <div className="container-limited py-20 md:py-28">
                <div className="text-center space-y-4 mb-12">
                    <h2 className="font-headline text-3xl md:text-4xl font-bold">{t.testimonials.title}</h2>
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                        {t.testimonials.subtitle}
                    </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {testimonials.map((testimonial, i) => (
                    <Card key={i} className="border-none shadow-lg bg-secondary/50">
                        <CardContent className="p-8 relative flex flex-col h-full">
                            <Quote className="w-12 h-12 text-primary/20 absolute top-4 right-4" />
                            <div className="flex mb-4">
                                {[...Array(5)].map((_, j) => (
                                    <Star key={j} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>
                            <p className="text-muted-foreground italic flex-grow">"{testimonial.quote}"</p>
                            <div className="flex items-center gap-4 mt-6 pt-6 border-t">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                    {testimonial.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold">{testimonial.name}</p>
                                    <p className="text-sm text-muted-foreground">{testimonial.project}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                </div>
            </div>
        </section>


        <section className="w-full py-20 md:py-28 bg-secondary/50">
            <div className="container-limited text-center">
                <h2 className="font-headline text-3xl md:text-4xl font-bold">{t.finalCta.title}</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4 mb-8">
                    {t.finalCta.subtitle}
                </p>
                <Button asChild size="lg" className="font-bold">
                    <Link href="/budget-request">
                        {t.hero.cta}
                        <ArrowRight className="ml-2" />
                    </Link>
                </Button>
            </div>
        </section>

      </main>
      <Footer t={t.finalCta} />
    </>
  );
}
