"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Carousel, Card } from "@/components/ui/apple-cards-carousel";

const ProductContent = ({ description, benefits }: { description: string; benefits: string[] }) => {
  return (
    <div className="bg-[#F5F5F7] dark:bg-neutral-800 p-8 md:p-14 rounded-3xl">
      <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-xl font-sans max-w-3xl mx-auto mb-6">
        {description}
      </p>
      <ul className="space-y-3 text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
        {benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2">
            <span className="text-green-500 font-bold">✓</span>
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const productosData = [
  {
    category: "Electrónica",
    title: "Laptop HP 15.6",
    src: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80",
    content: <ProductContent 
      description="Encuentra las mejores ofertas en laptops y computadoras. Los negocios locales te ofrecen precios competitivos y servicio personalizado."
      benefits={["Entrega rápida en tu zona", "Soporte técnico local", "Garantía y servicio post-venta"]}
    />,
  },
  {
    category: "Alimentos",
    title: "Pizza Familiar",
    src: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
    content: <ProductContent 
      description="Pide tus comidas favoritas y recibe ofertas de restaurantes cercanos. Compara precios y elige la mejor opción."
      benefits={["Ingredientes frescos", "Preparación al momento", "Delivery disponible"]}
    />,
  },
  {
    category: "Hogar",
    title: "Muebles de Sala",
    src: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
    content: <ProductContent 
      description="Encuentra muebles y decoración para tu hogar. Negocios locales te ofrecen diseños únicos y precios accesibles."
      benefits={["Diseños personalizados", "Materiales de calidad", "Instalación incluida"]}
    />,
  },
  {
    category: "Ropa",
    title: "Ropa Casual",
    src: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80",
    content: <ProductContent 
      description="Descubre las últimas tendencias en moda. Tiendas locales te ofrecen variedad y estilo a precios competitivos."
      benefits={["Últimas tendencias", "Tallas variadas", "Asesoría de estilo"]}
    />,
  },
  {
    category: "Servicios",
    title: "Reparaciones",
    src: "https://images.unsplash.com/photo-1581092918484-8313e1f7e8c6?w=800&q=80",
    content: <ProductContent 
      description="Encuentra profesionales para reparaciones y servicios. Recibe cotizaciones de expertos en tu área."
      benefits={["Profesionales certificados", "Presupuestos claros", "Trabajo garantizado"]}
    />,
  },
  {
    category: "Ferretería",
    title: "Herramientas",
    src: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&q=80",
    content: <ProductContent 
      description="Encuentra herramientas y materiales para tus proyectos. Ferreterías locales con stock disponible."
      benefits={["Amplio inventario", "Asesoría técnica", "Entrega inmediata"]}
    />,
  },
  {
    category: "Papelería",
    title: "Útiles Escolares",
    src: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&q=80",
    content: <ProductContent 
      description="Todo para la escuela y oficina. Papelerías cercanas con precios especiales y variedad."
      benefits={["Gran variedad", "Precios al por mayor", "Entregas a domicilio"]}
    />,
  },
  {
    category: "Mascotas",
    title: "Alimento para Mascotas",
    src: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80",
    content: <ProductContent 
      description="Todo lo que tu mascota necesita. Veterinarias y tiendas especializadas con productos de calidad."
      benefits={["Marcas reconocidas", "Asesoría veterinaria", "Delivery disponible"]}
    />,
  },
];

export default function HeroSectionOne() {
  const router = useRouter();

  const cards = productosData.map((card, index) => (
    <Card key={card.src} card={card} index={index} />
  ));

  return (
    <div className="relative mx-auto flex w-full flex-col items-center justify-center">
      <div className="px-4 py-10 md:py-20">
        <h1 className="relative z-10 mx-auto mt-20 max-w-4xl text-center text-2xl font-bold text-slate-700 md:text-4xl lg:text-7xl dark:text-slate-300">
          {"Pide lo que quieras, los negocios te encuentran"
            .split(" ")
            .map((word) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: 0.1,
                  ease: "easeInOut",
                }}
                className="mr-2 inline-block"
              >
                {word}
              </motion.span>
            ))}
        </h1>

        <motion.p
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            duration: 0.3,
            delay: 0.8,
          }}
          className="relative z-10 mx-auto max-w-xl py-4 text-center text-lg font-normal text-neutral-600 dark:text-neutral-400"
        >
          Con ayuda de inteligencia artificial, conecta con los negocios locales y recibe ofertas en tiempo real.
        </motion.p>
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            duration: 0.3,
            delay: 1,
          }}
          className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <Button 
            onClick={() => router.push('/solicitudes')}
            className="w-60 transform rounded-lg bg-slate-700 px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-700 dark:bg-white dark:text-slate-700 dark:hover:bg-gray-200"
          >
            Quiero pedir
          </Button>
          <Button className="w-60 transform rounded-lg border border-gray-300 bg-white px-6 py-2 font-medium text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-100 dark:border-gray-700 dark:bg-slate-700 dark:text-white dark:hover:bg-gray-900">
            Aprende más
          </Button>
        </motion.div>
      </div>

      {/* Carousel de productos */}
      <div className="w-screen overflow-hidden">
        <Carousel items={cards} />
      </div>
    </div>
  );
}

// Componente Navbar eliminado porque no se usa
