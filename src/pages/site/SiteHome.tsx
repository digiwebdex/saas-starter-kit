import PublicLayout from "@/components/PublicLayout";
import { useWebsite } from "@/contexts/WebsiteContext";
import TravelAgencyTemplate from "@/components/templates/TravelAgencyTemplate";
import HajjUmrahTemplate from "@/components/templates/HajjUmrahTemplate";
import TourPackagesTemplate from "@/components/templates/TourPackagesTemplate";

const templateMap = {
  "travel-agency": TravelAgencyTemplate,
  "hajj-umrah": HajjUmrahTemplate,
  "tour-packages": TourPackagesTemplate,
};

const SiteHome = () => {
  const { websiteConfig } = useWebsite();
  const Template = templateMap[websiteConfig.template] || TravelAgencyTemplate;

  return (
    <PublicLayout>
      <Template config={websiteConfig} />
    </PublicLayout>
  );
};

export default SiteHome;
