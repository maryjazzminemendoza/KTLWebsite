import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Heritage from "@/components/Heritage";
import BestSellers from "@/components/BestSellers";
import LakesideExperience from "@/components/LakesideExperience";
import WhyFamiliesReturn from "@/components/WhyFamiliesReturn";
import Testimonials from "@/components/Testimonials";
import ReservationCTA from "@/components/ReservationCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Heritage />
        <BestSellers />
        <LakesideExperience />
        <WhyFamiliesReturn />
        <Testimonials />
        <ReservationCTA />
      </main>
      <Footer />
    </>
  );
}