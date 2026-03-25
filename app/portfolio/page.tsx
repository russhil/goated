import Navbar from '@/components/Navbar';
import ContactFooter from '@/components/ContactFooter';
import CaseStudyGrid from '@/components/CaseStudyGrid';
import CustomCursor from '@/components/CustomCursor';

export default function PortfolioPage() {
  return (
    <main>
      <CustomCursor />
      <Navbar />
      <div className="pt-16">
        <CaseStudyGrid />
      </div>
      <ContactFooter />
    </main>
  );
}
