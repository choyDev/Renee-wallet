import SectionTitle from "../Common/SectionTitle";
import SectionShell from "../ui/SectionShell";
import SingleFeature from "./SingleFeature";
import featuresData from "./featuresData";

const Features = () => {
  return (
    <SectionShell id="features" className="py-16 md:py-20 lg:py-28">
      <div className="container">
        <SectionTitle
          title="Main Features"
          paragraph="Custodial wallet + lightweight crypto payments. Generate requests, accept multiple coins, track confirmations, receive webhooks, and optionally swap/bridge inside the app."
          center
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {featuresData.map((feature) => (
            <SingleFeature key={feature.id} feature={feature} />
          ))}
        </div>
      </div>
    </SectionShell>
  );
};

export default Features;
