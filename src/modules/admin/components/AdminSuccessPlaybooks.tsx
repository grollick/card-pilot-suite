import { BookOpen, Wrench, Scissors, Home, Briefcase, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Playbook {
  id: string;
  profession: string;
  icon: any;
  steps: { title: string; description: string }[];
}

const PLAYBOOKS: Playbook[] = [
  {
    id: "contractor",
    profession: "Contractor",
    icon: Wrench,
    steps: [
      { title: "Set up your digital card", description: "Add your services, coverage area, photos of past work, and contact info. A complete card gets 3x more leads." },
      { title: "Add your services & pricing", description: "List at least 3 services with clear pricing. Customers prefer transparent pricing — it builds trust instantly." },
      { title: "Enable online booking", description: "Turn on availability and let customers book estimates directly. This eliminates back-and-forth scheduling." },
      { title: "Share your card link", description: "Add your card link to Google Business, social media bios, and email signatures. Every touchpoint is a lead opportunity." },
      { title: "Follow up on leads quickly", description: "Respond within 5 minutes to increase close rates by 80%. Use automated follow-ups to never miss a lead." },
      { title: "Ask for reviews", description: "After completing a job, request a review. Social proof converts browsers into customers." },
    ],
  },
  {
    id: "barber",
    profession: "Barber / Stylist",
    icon: Scissors,
    steps: [
      { title: "Build your style portfolio", description: "Upload photos of your best work. Visual proof is everything in the grooming industry." },
      { title: "Set your services & durations", description: "Add each service with accurate time slots. This prevents overbooking and keeps your day running smooth." },
      { title: "Set up your weekly availability", description: "Block out lunch breaks, days off, and personal time. Your calendar should reflect reality." },
      { title: "Share your booking link on social", description: "Post your CardPilot booking link on Instagram, TikTok, and in your bio. Make booking frictionless." },
      { title: "Enable reminders", description: "Reduce no-shows with automated booking reminders sent to clients before their appointment." },
      { title: "Collect reviews after each cut", description: "Happy clients are your best marketing. Ask for a review right after they leave the chair." },
    ],
  },
  {
    id: "realtor",
    profession: "Realtor",
    icon: Home,
    steps: [
      { title: "Create your agent card", description: "Showcase your specialties, areas served, and recent transactions. First impressions matter in real estate." },
      { title: "Add your listings as projects", description: "Use the project showcase to display current and past listings with photos and details." },
      { title: "Set up lead capture forms", description: "Customize your contact form to capture buyer/seller intent, timeline, and budget range." },
      { title: "Distribute your card at open houses", description: "Use QR codes on flyers and business cards. Each scan is a potential lead automatically captured." },
      { title: "Automate follow-ups", description: "Set up email sequences for new leads. Consistent follow-up is the #1 predictor of closed deals." },
      { title: "Track your pipeline", description: "Move leads through stages from inquiry to closing. Know exactly where every deal stands." },
    ],
  },
  {
    id: "service-pro",
    profession: "Service Professional",
    icon: Briefcase,
    steps: [
      { title: "Complete your profile", description: "Fill in your profession, experience, and service area. Complete profiles rank higher in the marketplace." },
      { title: "Set competitive pricing", description: "Research your market and set prices that reflect your value. Include package deals when possible." },
      { title: "Enable instant booking", description: "The fastest way to convert interest into revenue. Let customers book without calling." },
      { title: "Go on-duty in the marketplace", description: "Toggle on-duty status to appear in the marketplace map. Customers can find and contact you instantly." },
      { title: "Build your reputation", description: "Deliver great service, collect reviews, and maintain a high response rate. The algorithm rewards reliability." },
      { title: "Scale with automation", description: "Use email campaigns, social posting, and automated follow-ups to grow without more hours." },
    ],
  },
];

export default function AdminSuccessPlaybooks() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Success Playbooks</h2>
        <p className="text-sm text-muted-foreground">Step-by-step guides for different professions to succeed on the platform</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {PLAYBOOKS.map((pb) => (
          <Card key={pb.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <pb.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{pb.profession}</CardTitle>
                  <CardDescription>{pb.steps.length} steps to success</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                {pb.steps.map((step, i) => (
                  <AccordionItem key={i} value={`step-${i}`} className="border-b-0">
                    <AccordionTrigger className="text-sm py-2 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                          {i + 1}
                        </span>
                        {step.title}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pl-7">
                      {step.description}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
