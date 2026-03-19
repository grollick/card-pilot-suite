import { useState, useMemo } from "react";
import { FileText, Edit, Copy, Check, Search, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  profession?: string;
}

// ── Platform-level templates ──
const PLATFORM_TEMPLATES: EmailTemplate[] = [
  { id: "welcome", name: "Welcome Email", subject: "Welcome to CardPilot, {{name}}!", body: "Hi {{name}},\n\nWelcome to CardPilot! You're one step closer to growing your business.\n\nHere's what to do next:\n1. Set up your digital business card\n2. Add your services and availability\n3. Share your card link to start getting leads\n\nLet's get started!", category: "onboarding" },
  { id: "activation", name: "Activation Nudge", subject: "{{name}}, your card is almost ready!", body: "Hi {{name}},\n\nYou signed up for CardPilot but haven't published your card yet.\n\nA published card means customers can find you, book you, and send you leads — all automatically.\n\nIt only takes 2 minutes to go live. Ready?", category: "engagement" },
  { id: "engagement", name: "Engagement Boost", subject: "You just got a new lead, {{name}}!", body: "Hi {{name}},\n\nGreat news — someone just submitted an inquiry through your CardPilot card!\n\nResponding quickly can increase your chances of closing by 80%. Head to your dashboard to follow up now.", category: "engagement" },
  { id: "upgrade", name: "Upgrade Prompt", subject: "Unlock more leads with Pro, {{name}}", body: "Hi {{name}},\n\nYou've been getting great results on CardPilot! Here's what you're missing on Pro:\n\n• Unlimited contacts\n• Advanced analytics\n• Priority listing on the marketplace\n• Automated follow-ups\n\nOne new job pays for your entire month. Upgrade now and grow faster.", category: "conversion" },
  { id: "beta-expiry", name: "Beta Expiry Notice", subject: "Your beta access expires soon, {{name}}", body: "Hi {{name}},\n\nYour beta access to CardPilot Pro features expires in 3 days.\n\nTo keep your premium features and all the data you've built, upgrade to Pro before your access ends.\n\nEverything you've created will be preserved — just in a locked state until you upgrade.", category: "retention" },
];

// ── Cold outreach templates by profession ──
interface ColdTemplate {
  profession: string;
  category: string;
  templates: { name: string; subject: string; body: string }[];
}

const COLD_TEMPLATES: ColdTemplate[] = [
  // SALES & ADVISING
  { profession: "Real Estate Agent", category: "Sales & Advising", templates: [
    { name: "Neighborhood Expert Intro", subject: "Your neighborhood just got 3 new listings — here's why it matters", body: "Hi {{name}},\n\nI'm {{user_name}}, a local real estate agent specializing in your area.\n\nI noticed some recent market activity near you and wanted to share some insights that could affect your property value.\n\nWould you be open to a quick 10-minute market update call? No strings attached — just valuable info for homeowners like you.\n\nBest,\n{{user_name}}" },
    { name: "Home Value Offer", subject: "What's your home worth in today's market?", body: "Hi {{name}},\n\nHomes in your area have appreciated significantly this year. Curious what yours is worth?\n\nI provide free, no-obligation home valuations. It takes just 5 minutes and could surprise you.\n\nReply 'YES' and I'll send you a custom report.\n\n{{user_name}}" },
  ]},
  { profession: "Insurance Agent", category: "Sales & Advising", templates: [
    { name: "Coverage Review", subject: "Are you overpaying for insurance?", body: "Hi {{name}},\n\nMany people in {{area}} are paying more than they need to for coverage. I specialize in finding savings without reducing protection.\n\nWould you be open to a free 15-minute coverage review? Most clients save $300-$800/year.\n\nNo pressure, just numbers.\n\n{{user_name}}" },
    { name: "Life Event Check-in", subject: "Big changes? Your insurance should change too", body: "Hi {{name}},\n\nLife changes — new home, new baby, new business — often mean your insurance needs updating.\n\nI help people make sure they're properly covered without overpaying. Want a quick review?\n\n{{user_name}}" },
  ]},
  { profession: "Financial Advisor", category: "Sales & Advising", templates: [
    { name: "Retirement Reality Check", subject: "Quick question about your retirement plan", body: "Hi {{name}},\n\nMost people don't know if they're on track for retirement until it's too late.\n\nI offer a free 20-minute financial health check — no sales pitch, just clarity on where you stand.\n\nWould that be helpful?\n\n{{user_name}}" },
    { name: "Tax Season Opportunity", subject: "3 tax moves to make before year-end", body: "Hi {{name}},\n\nWith year-end approaching, there are a few smart moves that could save you thousands in taxes.\n\nI'm offering complimentary year-end planning sessions this month. Interested?\n\n{{user_name}}" },
  ]},
  { profession: "Mortgage Broker", category: "Sales & Advising", templates: [
    { name: "Rate Drop Alert", subject: "Rates just hit a {{timeframe}} low — is now your time?", body: "Hi {{name}},\n\nMortgage rates just dropped to levels we haven't seen in months. If you've been thinking about buying or refinancing, this could be your window.\n\nI can run the numbers for you in under 10 minutes. No commitment needed.\n\n{{user_name}}" },
    { name: "First-Time Buyer Outreach", subject: "Thinking about buying your first home?", body: "Hi {{name}},\n\nBuying your first home can feel overwhelming, but it doesn't have to be.\n\nI help first-time buyers navigate the process from pre-approval to closing. Want to know what you qualify for? It's free and takes 5 minutes.\n\n{{user_name}}" },
  ]},
  { profession: "Car Sales", category: "Sales & Advising", templates: [
    { name: "Trade-In Value", subject: "Your car might be worth more than you think", body: "Hi {{name}},\n\nUsed car values are at record highs right now. Your {{vehicle_type}} could be worth more than you expect.\n\nWant a free, no-obligation appraisal? It takes 5 minutes and there's zero pressure.\n\n{{user_name}}" },
  ]},
  { profession: "Solar Consultant", category: "Sales & Advising", templates: [
    { name: "Energy Savings Intro", subject: "Your neighbors are saving $200/mo on energy — here's how", body: "Hi {{name}},\n\nSeveral homes in your area recently went solar and are saving an average of $200/month on energy bills.\n\nWith current incentives, the upfront cost is lower than most people think. Want to see what you'd save?\n\nFree assessment, no commitment.\n\n{{user_name}}" },
  ]},
  { profession: "SaaS Sales Rep", category: "Sales & Advising", templates: [
    { name: "Problem-Solution Intro", subject: "Quick question about {{pain_point}}", body: "Hi {{name}},\n\nI noticed {{company}} is in the {{industry}} space. Many companies like yours struggle with {{pain_point}}.\n\nWe help teams solve this in weeks, not months. Would a 15-minute call be worth your time to see if we're a fit?\n\n{{user_name}}" },
  ]},
  { profession: "Recruiter", category: "Sales & Advising", templates: [
    { name: "Talent Opportunity", subject: "A role that matches your profile perfectly", body: "Hi {{name}},\n\nI came across your profile and think you'd be a great fit for a {{role_type}} position at a growing company.\n\nThe comp is competitive, the team is strong, and I think it's worth a conversation. Open to hearing more?\n\n{{user_name}}" },
  ]},

  // HOME & TRADE
  { profession: "General Contractor", category: "Home & Trade", templates: [
    { name: "Seasonal Project Intro", subject: "Planning a home project this {{season}}?", body: "Hi {{name}},\n\nI'm {{user_name}}, a licensed general contractor serving your area.\n\nWith {{season}} coming up, it's the perfect time to tackle that renovation you've been thinking about. I offer free on-site estimates with transparent pricing — no surprises.\n\nWant to schedule a quick walk-through?\n\n{{user_name}}" },
    { name: "Neighbor Reference", subject: "I just finished a project in your neighborhood", body: "Hi {{name}},\n\nI recently completed a {{project_type}} project for a homeowner near you and the results turned out great.\n\nIf you have any home improvement projects on your list, I'd love to give you a free estimate. My work is fully licensed and insured.\n\n{{user_name}}" },
  ]},
  { profession: "Electrician", category: "Home & Trade", templates: [
    { name: "Safety Check Offer", subject: "When was your last electrical inspection?", body: "Hi {{name}},\n\nMost homes go years without an electrical safety check. Outdated wiring is one of the top causes of house fires.\n\nI'm offering discounted electrical inspections this month. It takes about an hour and gives you peace of mind.\n\nInterested?\n\n{{user_name}}" },
  ]},
  { profession: "Plumber", category: "Home & Trade", templates: [
    { name: "Preventive Maintenance", subject: "A $99 plumbing check could save you $5,000", body: "Hi {{name}},\n\nSmall leaks and slow drains can turn into expensive emergencies fast.\n\nI'm offering a whole-home plumbing inspection for $99 this month. Catch problems before they become disasters.\n\n{{user_name}}" },
  ]},
  { profession: "HVAC Technician", category: "Home & Trade", templates: [
    { name: "Seasonal Tune-Up", subject: "Is your AC ready for {{season}}?", body: "Hi {{name}},\n\nMost HVAC breakdowns happen during peak season — when you need it most.\n\nA quick tune-up now can prevent costly emergency repairs later. I'm booking seasonal check-ups at a special rate.\n\nWant to get on the schedule?\n\n{{user_name}}" },
  ]},
  { profession: "Painter", category: "Home & Trade", templates: [
    { name: "Curb Appeal Boost", subject: "A fresh coat of paint can add $10K to your home value", body: "Hi {{name}},\n\nThinking about freshening up your home's look? Professional painting is one of the highest-ROI home improvements you can make.\n\nI offer free color consultations and transparent quotes. No pressure, just great results.\n\n{{user_name}}" },
  ]},
  { profession: "Landscaper", category: "Home & Trade", templates: [
    { name: "Curb Appeal Intro", subject: "Your yard could be the best on the block", body: "Hi {{name}},\n\nI'm {{user_name}}, a local landscaper specializing in transforming outdoor spaces.\n\nWhether you want low-maintenance beauty or a full redesign, I'd love to share some ideas. Free consultation, no obligation.\n\n{{user_name}}" },
  ]},
  { profession: "Roofer", category: "Home & Trade", templates: [
    { name: "Storm Season Prep", subject: "Is your roof ready for storm season?", body: "Hi {{name}},\n\nStorm season is coming. A quick roof inspection now can save you thousands in emergency repairs later.\n\nI offer free inspections and honest assessments. No scare tactics, just facts.\n\n{{user_name}}" },
  ]},
  { profession: "Cleaning Service", category: "Home & Trade", templates: [
    { name: "First Clean Free", subject: "Try us risk-free — first clean 50% off", body: "Hi {{name}},\n\nI know trusting someone with your home is a big deal. That's why I'm offering 50% off your first cleaning — no commitment required.\n\nIf you love it, we'll set up a schedule. If not, no hard feelings.\n\n{{user_name}}" },
  ]},
  { profession: "Window Cleaner", category: "Home & Trade", templates: [
    { name: "Spring Clean Offer", subject: "Crystal clear windows before {{season}}", body: "Hi {{name}},\n\nNothing transforms a home like sparkling clean windows. I'm booking {{season}} cleanings now at early-bird rates.\n\nFree quote, no obligation.\n\n{{user_name}}" },
  ]},
  { profession: "Garage Door Technician", category: "Home & Trade", templates: [
    { name: "Safety Inspection", subject: "Your garage door opens 1,500 times a year — is it safe?", body: "Hi {{name}},\n\nGarage doors are the largest moving part of your home, and worn springs or cables can be dangerous.\n\nI offer free safety inspections. Takes 15 minutes, could prevent a serious accident.\n\n{{user_name}}" },
  ]},
  { profession: "Carpet Cleaner", category: "Home & Trade", templates: [
    { name: "Deep Clean Intro", subject: "When was the last time your carpets were really clean?", body: "Hi {{name}},\n\nProfessional carpet cleaning removes allergens, bacteria, and stains that vacuuming can't reach.\n\nI'm offering a special rate for first-time customers this month. Want a free quote?\n\n{{user_name}}" },
  ]},

  // HEALTH & WELLNESS
  { profession: "Chiropractor", category: "Health & Wellness", templates: [
    { name: "Pain Relief Intro", subject: "Living with back pain? You don't have to", body: "Hi {{name}},\n\nIf you're dealing with back pain, neck tension, or headaches, chiropractic care might be the solution you haven't tried yet.\n\nI'm offering a complimentary initial assessment for new patients. No commitment — just an honest evaluation.\n\n{{user_name}}" },
  ]},
  { profession: "Personal Trainer", category: "Health & Wellness", templates: [
    { name: "Free Session Offer", subject: "Your first workout is on me", body: "Hi {{name}},\n\nI'm {{user_name}}, a certified personal trainer in your area.\n\nI know starting a fitness routine can feel intimidating. That's why I'm offering a free first session — no commitment, no pressure. Just a great workout.\n\nReady to try it?\n\n{{user_name}}" },
  ]},
  { profession: "Physical Therapist", category: "Health & Wellness", templates: [
    { name: "Movement Screen", subject: "Are you moving as well as you could be?", body: "Hi {{name}},\n\nMany injuries happen because of movement patterns we don't even notice.\n\nI'm offering free 15-minute movement screens this month. It's quick, painless, and could prevent your next injury.\n\n{{user_name}}" },
  ]},
  { profession: "Massage Therapist", category: "Health & Wellness", templates: [
    { name: "Stress Relief Intro", subject: "Carrying tension? Let's fix that", body: "Hi {{name}},\n\nIf you're feeling stressed, tight, or just worn out — a professional massage can make a world of difference.\n\nI'm offering $20 off first sessions this month. Your body will thank you.\n\n{{user_name}}" },
  ]},
  { profession: "Nutritionist", category: "Health & Wellness", templates: [
    { name: "Nutrition Audit", subject: "What if your diet is holding you back?", body: "Hi {{name}},\n\nMost people don't realize how much their diet affects their energy, mood, and performance.\n\nI offer a free 20-minute nutrition audit to identify quick wins. No meal plans to buy — just practical advice.\n\n{{user_name}}" },
  ]},
  { profession: "Yoga Instructor", category: "Health & Wellness", templates: [
    { name: "First Class Free", subject: "Your first yoga class is free — no experience needed", body: "Hi {{name}},\n\nYoga isn't about being flexible — it's about becoming flexible. Everyone starts somewhere.\n\nI'm offering a free trial class for beginners. All levels welcome, zero judgment.\n\n{{user_name}}" },
  ]},
  { profession: "Dentist", category: "Health & Wellness", templates: [
    { name: "New Patient Special", subject: "New patient special: exam + cleaning for $99", body: "Hi {{name}},\n\nLooking for a new dentist? We're welcoming new patients with a special rate — comprehensive exam and cleaning for just $99.\n\nWe focus on comfort and honest care. No unnecessary upsells.\n\n{{user_name}}" },
  ]},
  { profession: "Therapist / Counselor", category: "Health & Wellness", templates: [
    { name: "Mental Health Check-in", subject: "It's okay to ask for help", body: "Hi {{name}},\n\nIf you've been feeling overwhelmed, anxious, or stuck — talking to someone can help more than you might think.\n\nI offer a free 15-minute phone consultation to see if we'd be a good fit. No pressure, completely confidential.\n\n{{user_name}}" },
  ]},
  { profession: "Acupuncturist", category: "Health & Wellness", templates: [
    { name: "Natural Pain Relief", subject: "Tried everything for pain? Try this", body: "Hi {{name}},\n\nAcupuncture has helped millions find relief from chronic pain, migraines, and stress — without medication.\n\nI'm offering a discounted first session. Curious? Let's chat.\n\n{{user_name}}" },
  ]},
  { profession: "Pilates Instructor", category: "Health & Wellness", templates: [
    { name: "Intro Session", subject: "Pilates changed my life — let me show you why", body: "Hi {{name}},\n\nPilates builds strength, flexibility, and posture in ways other workouts can't.\n\nI'm offering a free introductory session. No experience needed — just come as you are.\n\n{{user_name}}" },
  ]},

  // BEAUTY
  { profession: "Hair Stylist", category: "Beauty", templates: [
    { name: "New Client Welcome", subject: "Looking for a new stylist? Let's chat", body: "Hi {{name}},\n\nFinding the right stylist is personal — and I'd love to be yours.\n\nI'm offering 20% off your first visit so you can try my services risk-free. I specialize in {{specialty}} and love making people feel confident.\n\n{{user_name}}" },
  ]},
  { profession: "Barber", category: "Beauty", templates: [
    { name: "First Cut Free", subject: "Your first cut is on the house", body: "Hi {{name}},\n\nLooking for a new barber? I get it — it's hard to switch. That's why your first cut is free. If you love it, you've found your new spot. If not, no hard feelings.\n\n{{user_name}}" },
  ]},
  { profession: "Nail Technician", category: "Beauty", templates: [
    { name: "Grand Opening / Intro", subject: "Treat yourself — 15% off your first visit", body: "Hi {{name}},\n\nI'm {{user_name}}, a nail technician specializing in gel, acrylics, and nail art.\n\nI'm offering 15% off for first-time clients. You deserve a little self-care!\n\n{{user_name}}" },
  ]},
  { profession: "Makeup Artist", category: "Beauty", templates: [
    { name: "Event Ready", subject: "Big event coming up? Let me make you glow", body: "Hi {{name}},\n\nWhether it's a wedding, gala, or photoshoot — professional makeup makes all the difference.\n\nI'd love to help you look and feel your absolute best. Let's chat about your event!\n\n{{user_name}}" },
  ]},
  { profession: "Esthetician", category: "Beauty", templates: [
    { name: "Skin Consultation", subject: "What's your skin telling you?", body: "Hi {{name}},\n\nYour skin is unique, and it deserves a personalized approach.\n\nI'm offering free skin consultations this month. Let's create a plan that actually works for your skin type.\n\n{{user_name}}" },
  ]},
  { profession: "Tattoo Artist", category: "Beauty", templates: [
    { name: "Portfolio Showcase", subject: "Thinking about your next tattoo?", body: "Hi {{name}},\n\nI'm {{user_name}}, a tattoo artist specializing in {{style}}.\n\nI'm booking consultations for custom pieces. Check out my portfolio and let's bring your idea to life.\n\nFree consultation, no deposit until you're 100% happy with the design.\n\n{{user_name}}" },
  ]},

  // CREATIVE & MEDIA
  { profession: "Photographer", category: "Creative & Media", templates: [
    { name: "Portfolio Pitch", subject: "Need stunning photos? Let's talk", body: "Hi {{name}},\n\nGreat photos tell your story better than words ever could.\n\nI'm {{user_name}}, a professional photographer specializing in {{specialty}}. I'm offering a limited number of sessions this month at a special rate.\n\nWant to see my portfolio?\n\n{{user_name}}" },
  ]},
  { profession: "Videographer", category: "Creative & Media", templates: [
    { name: "Video Content Pitch", subject: "Video is the #1 way to grow your brand", body: "Hi {{name}},\n\nBusinesses using video grow revenue 49% faster. If you're not using video yet, you're leaving money on the table.\n\nI create professional brand videos, social content, and event coverage. Let's chat about what video could do for {{company}}.\n\n{{user_name}}" },
  ]},
  { profession: "Graphic Designer", category: "Creative & Media", templates: [
    { name: "Brand Refresh", subject: "Is your brand saying what you want it to?", body: "Hi {{name}},\n\nYour brand is your first impression — and it happens in seconds.\n\nI help businesses create memorable, professional visual identities. From logos to full brand systems, I'd love to show you what's possible.\n\nFree 30-minute consultation.\n\n{{user_name}}" },
  ]},
  { profession: "Web Developer", category: "Creative & Media", templates: [
    { name: "Website Audit", subject: "Is your website costing you customers?", body: "Hi {{name}},\n\nA slow, outdated website can lose you up to 50% of potential customers.\n\nI offer free website audits — I'll review your site's speed, mobile experience, and conversion potential. No strings attached.\n\n{{user_name}}" },
  ]},
  { profession: "DJ", category: "Creative & Media", templates: [
    { name: "Event Entertainment", subject: "Make your next event unforgettable", body: "Hi {{name}},\n\nThe right music transforms an event from good to legendary.\n\nI'm {{user_name}}, a professional DJ with 500+ events under my belt. I'd love to chat about your upcoming event.\n\nFree consultation, custom playlists included.\n\n{{user_name}}" },
  ]},
  { profession: "Interior Designer", category: "Creative & Media", templates: [
    { name: "Room Transformation", subject: "Imagine your space — but better", body: "Hi {{name}},\n\nEvery room has potential. Sometimes it just takes a fresh eye to see it.\n\nI offer virtual design consultations starting at $100. Let's transform your space without the stress.\n\n{{user_name}}" },
  ]},
  { profession: "Content Creator", category: "Creative & Media", templates: [
    { name: "Collaboration Pitch", subject: "Let's create content together", body: "Hi {{name}},\n\nI love what {{company}} is doing. I think my audience would resonate with your brand.\n\nI'd love to discuss a collaboration — UGC, sponsored content, or social takeover. Here's my media kit.\n\n{{user_name}}" },
  ]},
  { profession: "Copywriter", category: "Creative & Media", templates: [
    { name: "Website Copy Audit", subject: "Your website copy might be losing you sales", body: "Hi {{name}},\n\nGreat products fail with weak copy. I specialize in turning browsers into buyers through clear, compelling writing.\n\nWant a free copy audit of your top landing page? I'll send you 3 actionable improvements.\n\n{{user_name}}" },
  ]},
  { profession: "Social Media Manager", category: "Creative & Media", templates: [
    { name: "Social Growth Pitch", subject: "Your social media could be working harder for you", body: "Hi {{name}},\n\nI noticed {{company}} has a great product but your social presence could be driving more leads.\n\nI help businesses turn followers into customers. Want a free social media audit?\n\n{{user_name}}" },
  ]},
  { profession: "Music Teacher", category: "Creative & Media", templates: [
    { name: "Free Trial Lesson", subject: "Ever wanted to learn {{instrument}}?", body: "Hi {{name}},\n\nIt's never too late to start learning music. I teach all ages and levels, and I make it fun.\n\nYour first lesson is free — no commitment. Let's see if we're a good fit!\n\n{{user_name}}" },
  ]},

  // AUTOMOTIVE
  { profession: "Auto Mechanic", category: "Automotive", templates: [
    { name: "New Customer Intro", subject: "Tired of overpaying at the dealership?", body: "Hi {{name}},\n\nDealership prices are 30-50% higher than independent shops — for the exact same work.\n\nI'm a certified mechanic offering honest, transparent pricing. First-time customers get a free diagnostic.\n\n{{user_name}}" },
  ]},
  { profession: "Auto Detailer", category: "Automotive", templates: [
    { name: "Detail Special", subject: "Your car deserves a spa day", body: "Hi {{name}},\n\nA professional detail doesn't just make your car look amazing — it protects your investment.\n\nI'm offering 20% off full details this month. Mobile service available — I come to you!\n\n{{user_name}}" },
  ]},
  { profession: "Mobile Car Wash", category: "Automotive", templates: [
    { name: "Convenience Pitch", subject: "We wash your car while you work", body: "Hi {{name}},\n\nNo more waiting at the car wash. I come to your home or office and make your car shine while you do your thing.\n\nFirst wash 50% off. Try it once and you'll never go back.\n\n{{user_name}}" },
  ]},
  { profession: "Towing Service", category: "Automotive", templates: [
    { name: "Fleet Partnership", subject: "Reliable towing for your fleet", body: "Hi {{name}},\n\nManaging a fleet means breakdowns happen. When they do, you need a towing partner who responds fast and treats your vehicles with care.\n\nI'd love to discuss a fleet partnership. Let's chat.\n\n{{user_name}}" },
  ]},

  // LEGAL & FINANCE
  { profession: "Attorney", category: "Legal & Finance", templates: [
    { name: "Free Consultation", subject: "Legal question? First consultation is free", body: "Hi {{name}},\n\nLegal issues can feel overwhelming, but you don't have to face them alone.\n\nI'm offering free 30-minute initial consultations. Whether it's a contract, dispute, or planning question — let's talk.\n\nNo obligation, just answers.\n\n{{user_name}}" },
  ]},
  { profession: "Accountant", category: "Legal & Finance", templates: [
    { name: "Tax Savings", subject: "You might be leaving money on the table", body: "Hi {{name}},\n\nMost small business owners overpay on taxes because they miss deductions they qualify for.\n\nI offer a free tax savings review — 15 minutes could save you thousands. Interested?\n\n{{user_name}}" },
  ]},
  { profession: "Notary Public", category: "Legal & Finance", templates: [
    { name: "Mobile Notary Intro", subject: "Need a notary? I come to you", body: "Hi {{name}},\n\nSkip the trip to the office. I'm a mobile notary and I come to your location — home, office, or coffee shop.\n\nFlexible scheduling, including evenings and weekends. What do you need notarized?\n\n{{user_name}}" },
  ]},
  { profession: "Tax Preparer", category: "Legal & Finance", templates: [
    { name: "Tax Season Outreach", subject: "Tax season is here — let's make it painless", body: "Hi {{name}},\n\nDreading tax season? I make it stress-free. Accurate filing, maximum refund, and I handle all the paperwork.\n\nEarly filers get priority scheduling. Ready to get started?\n\n{{user_name}}" },
  ]},
  { profession: "Bookkeeper", category: "Legal & Finance", templates: [
    { name: "Messy Books Fix", subject: "Are your books a mess? No judgment", body: "Hi {{name}},\n\nI've seen it all — shoeboxes of receipts, years of unfiled records, complete chaos. And I've fixed it all.\n\nLet me clean up your books so you can focus on running your business. Free consultation.\n\n{{user_name}}" },
  ]},

  // EDUCATION
  { profession: "Tutor", category: "Education", templates: [
    { name: "Academic Support", subject: "Struggling in {{subject}}? I can help", body: "Hi {{name}},\n\nI'm {{user_name}}, a tutor specializing in {{subject}}. I've helped hundreds of students improve their grades and confidence.\n\nI offer a free trial session so we can find the right approach for your student. No commitment required.\n\n{{user_name}}" },
  ]},
  { profession: "Driving Instructor", category: "Education", templates: [
    { name: "Learn to Drive", subject: "Ready to get your license?", body: "Hi {{name}},\n\nLearning to drive should be fun, not stressful. I'm a patient, experienced instructor with a 95% pass rate.\n\nFirst lesson is discounted so you can see if we're a good fit. Let's get you on the road!\n\n{{user_name}}" },
  ]},
  { profession: "Language Teacher", category: "Education", templates: [
    { name: "Language Learning Intro", subject: "Learn {{language}} faster than you think", body: "Hi {{name}},\n\nFluency starts with one conversation. I teach {{language}} using immersive, practical methods that get results fast.\n\nFree trial lesson — let's see where you are and where you want to go.\n\n{{user_name}}" },
  ]},
  { profession: "Life Coach", category: "Education", templates: [
    { name: "Discovery Session", subject: "What would you do if you knew you couldn't fail?", body: "Hi {{name}},\n\nSometimes we just need someone to help us see what's possible.\n\nI'm a certified life coach and I offer free 30-minute discovery sessions. No pitch, no pressure — just a powerful conversation.\n\nReady to explore?\n\n{{user_name}}" },
  ]},
  { profession: "Swim Instructor", category: "Education", templates: [
    { name: "Water Safety", subject: "Water safety starts with swim lessons", body: "Hi {{name}},\n\nDrowning is the #1 cause of accidental death for kids under 5. Swim lessons can reduce that risk by 88%.\n\nI offer private and group lessons for all ages. First assessment is free.\n\n{{user_name}}" },
  ]},

  // FOOD & EVENTS
  { profession: "Caterer", category: "Food & Events", templates: [
    { name: "Event Catering Pitch", subject: "Planning an event? Let's talk food", body: "Hi {{name}},\n\nGreat food makes great events. I'm {{user_name}}, a professional caterer specializing in {{cuisine_type}}.\n\nI'd love to create a custom menu for your next event. Free tasting for events of 50+ guests.\n\n{{user_name}}" },
  ]},
  { profession: "Wedding Planner", category: "Food & Events", templates: [
    { name: "Dream Wedding", subject: "Your dream wedding, without the stress", body: "Hi {{name}},\n\nCongratulations on your engagement! Planning a wedding should be exciting, not exhausting.\n\nI handle every detail so you can enjoy the journey. Free initial consultation to discuss your vision.\n\n{{user_name}}" },
  ]},
  { profession: "Event Planner", category: "Food & Events", templates: [
    { name: "Corporate Events", subject: "Make your next corporate event exceptional", body: "Hi {{name}},\n\nA well-planned event creates lasting impressions for your brand.\n\nI specialize in corporate events that wow — from venue selection to day-of coordination. Let's discuss your vision.\n\n{{user_name}}" },
  ]},
  { profession: "Baker / Pastry Chef", category: "Food & Events", templates: [
    { name: "Custom Order Intro", subject: "Custom cakes & pastries for your special moment", body: "Hi {{name}},\n\nEvery celebration deserves something sweet and special.\n\nI create custom cakes, pastries, and dessert tables for weddings, birthdays, and events. Free tasting available!\n\n{{user_name}}" },
  ]},
  { profession: "Personal Chef", category: "Food & Events", templates: [
    { name: "Private Chef Intro", subject: "Restaurant quality in your kitchen", body: "Hi {{name}},\n\nImagine coming home to a professionally cooked meal every night — without lifting a finger.\n\nI'm a private chef offering weekly meal prep and dinner party services. First session at a special rate.\n\n{{user_name}}" },
  ]},
  { profession: "Bartender", category: "Food & Events", templates: [
    { name: "Event Bar Service", subject: "Make your event unforgettable with craft cocktails", body: "Hi {{name}},\n\nA great bar elevates any event. I create custom cocktail menus, handle setup and cleanup, and keep the good times flowing.\n\nFree consultation for events of 30+ guests.\n\n{{user_name}}" },
  ]},
  { profession: "Florist", category: "Food & Events", templates: [
    { name: "Floral Design Intro", subject: "Flowers that tell your story", body: "Hi {{name}},\n\nWhether it's a wedding, corporate event, or a simple 'just because' — the right flowers make all the difference.\n\nI create custom arrangements that fit your style and budget. Free consultation!\n\n{{user_name}}" },
  ]},

  // PET & OTHER
  { profession: "Dog Trainer", category: "Pet & Other", templates: [
    { name: "Behavior Help", subject: "Is your dog pulling, barking, or not listening?", body: "Hi {{name}},\n\nMost behavior issues aren't about the dog — they're about communication.\n\nI'm a certified dog trainer and I can help. Free behavior assessment for new clients.\n\n{{user_name}}" },
  ]},
  { profession: "Dog Groomer", category: "Pet & Other", templates: [
    { name: "New Fur Client", subject: "Your pup deserves a spa day", body: "Hi {{name}},\n\nA good groomer makes all the difference for your pup's health and happiness.\n\nI offer gentle, patient grooming for all breeds. First groom 15% off!\n\n{{user_name}}" },
  ]},
  { profession: "Pet Sitter", category: "Pet & Other", templates: [
    { name: "Travel Peace of Mind", subject: "Going on vacation? Your pets are in good hands", body: "Hi {{name}},\n\nTravel worry-free knowing your pets are being loved and cared for at home.\n\nI'm a professional pet sitter with excellent references. Free meet-and-greet so your pets can get comfortable.\n\n{{user_name}}" },
  ]},
  { profession: "Veterinarian", category: "Pet & Other", templates: [
    { name: "New Patient Welcome", subject: "New to the area? Your pet needs a vet", body: "Hi {{name}},\n\nWelcome to the neighborhood! If you're looking for a vet who treats your pet like family, we'd love to meet you.\n\nNew patient special: first wellness exam free.\n\n{{user_name}}" },
  ]},
  { profession: "Handyman", category: "Pet & Other", templates: [
    { name: "Fix-It Intro", subject: "Got a to-do list? I can help", body: "Hi {{name}},\n\nThat list of small repairs and projects around the house? I can knock it out in a day.\n\nI'm a reliable, affordable handyman. No job too small. Free estimates.\n\n{{user_name}}" },
  ]},
  { profession: "Moving Company", category: "Pet & Other", templates: [
    { name: "Moving Soon", subject: "Moving soon? Let's make it stress-free", body: "Hi {{name}},\n\nMoving doesn't have to be chaotic. We handle everything — packing, loading, transport, and unpacking.\n\nFree in-home estimates and transparent pricing. No hidden fees.\n\n{{user_name}}" },
  ]},
  { profession: "Pressure Washer", category: "Pet & Other", templates: [
    { name: "Instant Curb Appeal", subject: "Your driveway needs this", body: "Hi {{name}},\n\nYears of grime, mold, and stains — gone in hours. Professional pressure washing instantly boosts your home's curb appeal.\n\nFree quote, no obligation. You'll be amazed at the difference.\n\n{{user_name}}" },
  ]},
  { profession: "Pool Service", category: "Pet & Other", templates: [
    { name: "Pool Season Prep", subject: "Pool season is coming — is yours ready?", body: "Hi {{name}},\n\nA clean, balanced pool is a happy pool. I offer weekly maintenance, equipment repair, and seasonal opening/closing.\n\nFirst month of service 20% off for new clients.\n\n{{user_name}}" },
  ]},
  { profession: "Locksmith", category: "Pet & Other", templates: [
    { name: "Security Upgrade", subject: "Are your locks keeping you safe?", body: "Hi {{name}},\n\nOld or damaged locks are an open invitation for trouble. I offer free security assessments and competitive pricing on upgrades.\n\nYour safety is worth a 10-minute conversation.\n\n{{user_name}}" },
  ]},
  { profession: "Pest Control", category: "Pet & Other", templates: [
    { name: "Prevention Pitch", subject: "Don't wait for a pest problem — prevent one", body: "Hi {{name}},\n\nPrevention is always cheaper than treatment. I offer quarterly prevention plans that keep your home pest-free year-round.\n\nFree inspection to assess your risk. No pressure.\n\n{{user_name}}" },
  ]},
  { profession: "Real Estate Appraiser", category: "Sales & Advising", templates: [
    { name: "Property Value Intro", subject: "Need an accurate property valuation?", body: "Hi {{name}},\n\nWhether you're buying, selling, refinancing, or settling an estate — an accurate appraisal protects your interests.\n\nI'm a certified appraiser with fast turnaround times. Let's schedule your inspection.\n\n{{user_name}}" },
  ]},
  { profession: "Property Manager", category: "Sales & Advising", templates: [
    { name: "Landlord Relief", subject: "Tired of managing your rental property?", body: "Hi {{name}},\n\nBeing a landlord is a full-time job. Tenant screening, maintenance, rent collection — I handle it all.\n\nI currently manage {{number}} properties in your area with a 98% occupancy rate. Free property evaluation.\n\n{{user_name}}" },
  ]},
];

const CATEGORY_COLORS: Record<string, string> = {
  onboarding: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  engagement: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  conversion: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  retention: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  cold: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

const COLD_CATEGORY_LIST = [...new Set(COLD_TEMPLATES.map((c) => c.category))];

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(PLATFORM_TEMPLATES);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeSection, setActiveSection] = useState<"platform" | "cold">("platform");

  const filteredCold = useMemo(() => {
    let result = COLD_TEMPLATES;
    if (categoryFilter !== "all") {
      result = result.filter((c) => c.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.profession.toLowerCase().includes(q) ||
          c.templates.some(
            (t) => t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q)
          )
      );
    }
    return result;
  }, [categoryFilter, search]);

  const openEdit = (t: EmailTemplate) => {
    setEditing(t);
    setEditSubject(t.subject);
    setEditBody(t.body);
  };

  const saveEdit = () => {
    if (!editing) return;
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === editing.id ? { ...t, subject: editSubject, body: editBody } : t
      )
    );
    setEditing(null);
    toast.success("Template updated");
  };

  const copyBody = (body: string) => {
    navigator.clipboard.writeText(body);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-4">
      {/* Section toggle */}
      <div className="flex items-center gap-2 border-b pb-3">
        <Button
          variant={activeSection === "platform" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSection("platform")}
        >
          Platform Templates ({PLATFORM_TEMPLATES.length})
        </Button>
        <Button
          variant={activeSection === "cold" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSection("cold")}
        >
          Cold Outreach by Profession ({COLD_TEMPLATES.length})
        </Button>
      </div>

      {/* ── Platform Templates ── */}
      {activeSection === "platform" && (
        <>
          <div>
            <h2 className="text-lg font-semibold">Platform Email Templates</h2>
            <p className="text-sm text-muted-foreground">Pre-built templates for onboarding, engagement, and retention</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((t) => (
              <Card key={t.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-sm">{t.name}</CardTitle>
                      <Badge variant="secondary" className={CATEGORY_COLORS[t.category] ?? ""}>
                        {t.category}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyBody(t.body)} title="Copy">
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)} title="Edit">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Subject: {t.subject}</p>
                  <p className="text-xs text-muted-foreground line-clamp-3">{t.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ── Cold Outreach Templates ── */}
      {activeSection === "cold" && (
        <>
          <div>
            <h2 className="text-lg font-semibold">Cold Outreach Templates</h2>
            <p className="text-sm text-muted-foreground">
              Profession-specific cold email templates for customer acquisition
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search professions or templates..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-1" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {COLD_CATEGORY_LIST.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredCold.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No templates match your search</p>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {filteredCold.map((ct) => (
                <AccordionItem key={ct.profession} value={ct.profession} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-3 text-left">
                      <span className="font-medium text-sm">{ct.profession}</span>
                      <Badge variant="secondary" className={CATEGORY_COLORS.cold}>
                        {ct.templates.length} template{ct.templates.length > 1 ? "s" : ""}
                      </Badge>
                      <span className="text-xs text-muted-foreground hidden sm:inline">{ct.category}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pb-4">
                    {ct.templates.map((t, i) => (
                      <Card key={i} className="bg-muted/30">
                        <CardHeader className="pb-2 pt-3 px-4">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-sm">{t.name}</CardTitle>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => copyBody(`Subject: ${t.subject}\n\n${t.body}`)}
                              title="Copy"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Subject: {t.subject}</p>
                          <p className="text-xs text-muted-foreground whitespace-pre-line">{t.body}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Template — {editing?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Body</Label>
              <Textarea rows={10} value={editBody} onChange={(e) => setEditBody(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={saveEdit}>
                <Check className="h-4 w-4 mr-1" /> Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
