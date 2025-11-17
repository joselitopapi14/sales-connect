import Image from "next/image";
import  HeroSectionOne  from "@/components/hero-section-demo-1";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";

export default function Home() {
  return (
    <div className="relative h-screen w-screen overflow-x-hidden">
      <div className="absolute inset-0 z-0">
        <BackgroundGradientAnimation 
          gradientBackgroundStart="rgb(255, 255, 255)"
          gradientBackgroundEnd="rgb(255, 255, 255)"
          firstColor="218, 165, 32"
          secondColor="255, 215, 0"
          thirdColor="180, 220, 240"
          fourthColor="200, 220, 235"
          fifthColor="255, 223, 186"
          pointerColor="150, 180, 220"
          containerClassName="h-full w-full"
        />
      </div>
      <div className="relative z-10">
        <HeroSectionOne />
      </div>
    </div>
  );
}
