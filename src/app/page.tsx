"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClient } from '@/components/client-provider';
import { 
  Zap, Check, MessageSquare, ShieldCheck, Clock, Users, BarChart3, 
  ChevronRight, Play, Star, HelpCircle, Mail, MapPin, Phone 
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useClient();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const testimonials = [
    {
      name: "Ramanathan K.",
      role: "Founder, Apex Chess Academy",
      content: "We were losing 15-20% of our monthly fees simply because parents forgot. Since automating reminders via RemindFlow, we recover 98% of payments on time. Teachers just mark attendance, the system handles the rest!",
      rating: 5,
      avatar: "♟️"
    },
    {
      name: "Sanya Mehta",
      role: "Director, Footwork Dance Studio",
      content: "The WhatsApp integrations are brilliant. Parents get payment links on their phone, pay instantly via UPI, and the system automatically logs it. No manual followups, no awkward phone calls.",
      rating: 5,
      avatar: "💃"
    },
    {
      name: "Amit Singhal",
      role: "Owner, Singhal Tuition Classes",
      content: "As a non-technical person, I wanted something dead simple. RemindFlow is extremely intuitive. The setup wizard got me running in 5 minutes. Highly recommended!",
      rating: 5,
      avatar: "📚"
    }
  ];

  const faqs = [
    {
      q: "Is this a Learning Management System (LMS)?",
      a: "No. This is a focused financial recovery and operations platform. We do not host courses or class recordings. Our sole focus is helping academy owners recover pending fees, track attendance, and automate reminders."
    },
    {
      q: "How does the WhatsApp automation work?",
      a: "Our system connects to the WhatsApp Business API. You define the rules (e.g. 7 days before due date, 3 days after). The system automatically formats the custom message, attaches the Razorpay payment link, and sends it directly to the parent's phone."
    },
    {
      q: "Do I need my own Razorpay account?",
      a: "Yes. You plug in your own Razorpay Key ID and Secret in your Academy Settings. The funds go directly from the parents' bank account to your merchant account immediately. We charge 0% commission on your transactions."
    },
    {
      q: "Can I import my existing students quickly?",
      a: "Absolutely! We provide an onboarding wizard that lets you upload a standard CSV file of your students, instantly seeding names, batches, monthly fees, and contact numbers in one go."
    }
  ];

  return (
    <div className="min-h-screen text-zinc-100 flex flex-col bg-[#070708]">
      
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md px-6 lg:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-violet-600 p-2 rounded-xl text-white shadow-[0_0_15px_#8b5cf6]">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">Remind<span className="text-violet-400">Flow</span></span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#benefits" className="hover:text-white transition-colors">Benefits</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
            Login
          </Link>
          <Link 
            href="/signup" 
            className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4.5 py-2 rounded-xl transition-all shadow-[0_4px_12px_rgba(139,92,246,0.3)] hover:scale-[1.02] active:scale-[0.98]"
          >
            Start Free Trial
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-20 px-6 lg:px-16 flex flex-col items-center text-center">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-4xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 px-3.5 py-1 rounded-full text-violet-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Check className="w-3.5 h-3.5" /> Built for Academies & Skill Centers
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.1] sm:leading-[1.05]">
            Recover More Fees.<br />
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">On Time. Automatically.</span>
          </h1>
          
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Automate WhatsApp due reminders, instant UPI payment links, attendance notifications, and recovery dashboard pipelines for teachers and coaching institutes.
          </p>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-4">
            <Link 
              href="/signup" 
              className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-4 rounded-xl text-base shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all hover:scale-[1.03] flex items-center gap-2"
            >
              Start 14-Day Free Trial <ChevronRight className="w-5 h-5" />
            </Link>
            <Link 
              href="#pricing"
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/10 font-bold px-8 py-4 rounded-xl text-base transition-all hover:border-white/20"
            >
              Book 1-on-1 Demo
            </Link>
          </div>

          <div className="pt-8 flex items-center justify-center gap-6 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> No credit card required</span>
            <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-400" /> Setup in 5 minutes</span>
          </div>
        </div>

        {/* Dashboard Preview mockup */}
        <div className="mt-16 w-full max-w-5xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-violet-950/20 bg-zinc-950 p-1">
          <div className="bg-zinc-900 rounded-xl overflow-hidden border border-white/5 p-4 sm:p-6 text-left space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-zinc-500 ml-2 font-mono">dashboard.remindflow.com/owner</span>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full font-bold">
                Live Simulator Active
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { title: 'Collection Rate', value: '94.2%', change: '+12.4% this month', color: 'text-emerald-400' },
                { title: 'Pending Fees', value: '₹14,500', change: '8 students pending', color: 'text-amber-400' },
                { title: 'Overdue Fees', value: '₹4,500', change: '3 defaulters', color: 'text-rose-400' },
                { title: 'WhatsApp Reminders', value: '184', change: '98% delivered', color: 'text-violet-400' }
              ].map((card, i) => (
                <div key={i} className="bg-zinc-950/60 p-4 rounded-xl border border-white/5">
                  <div className="text-xs text-zinc-500">{card.title}</div>
                  <div className={`text-xl sm:text-2xl font-bold mt-1 ${card.color}`}>{card.value}</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">{card.change}</div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-zinc-950/60 rounded-xl border border-white/5 space-y-3">
              <div className="text-xs font-bold text-zinc-300 flex justify-between">
                <span>Active Recovery Pipelines</span>
                <span className="text-zinc-500 text-[10px]">Auto-runs every 24 hours</span>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { name: 'Aarav Sharma', status: 'Pending', amount: '₹1,500', overdue: '12 days overdue', action: 'WhatsApp Triggered', statusCol: 'text-amber-400 bg-amber-500/5 border-amber-500/20' },
                  { name: 'Vihaan Verma', status: 'Overdue', amount: '₹1,500', overdue: '35 days overdue', action: 'Parent Call Required', statusCol: 'text-rose-400 bg-rose-500/5 border-rose-500/20' }
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center bg-zinc-900/60 p-2.5 rounded-lg border border-white/5">
                    <div>
                      <div className="font-semibold text-zinc-200">{row.name}</div>
                      <div className="text-[9px] text-zinc-500">{row.overdue}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-zinc-300">{row.amount}</span>
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-medium ${row.statusCol}`}>{row.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-zinc-950/50 border-y border-white/5 px-6 lg:px-16">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Packed with core recovery features</h2>
            <p className="text-zinc-400 text-sm sm:text-base">We ditch the bloat of LMS course managers. Everything is built to solve one thing: Recovering your payments on time.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <MessageSquare className="w-6 h-6 text-violet-400" />,
                title: "WhatsApp Reminders",
                desc: "Send due notifications automatically. Include clickable Razorpay payment links. Schedule rules for 7 days before, due date, or overdue notices."
              },
              {
                icon: <Clock className="w-6 h-6 text-emerald-400" />,
                title: "Auto Fee Generator",
                desc: "Specify separate monthly fees for students. The system automatically drafts fresh pending invoices at the beginning of each billing cycle."
              },
              {
                icon: <BarChart3 className="w-6 h-6 text-amber-400" />,
                title: "Recovery Dashboard",
                desc: "Track age-based overdue categories (1-7 days, 15-30 days). Instantly tap to trigger WhatsApp reminders or launch parent call logs."
              },
              {
                icon: <Users className="w-6 h-6 text-indigo-400" />,
                title: "Attendance Tracker",
                desc: "Mobile-friendly marking grid for teachers. Check daily batches and immediately alert parents via WhatsApp if a student is absent."
              },
              {
                icon: <ShieldCheck className="w-6 h-6 text-teal-400" />,
                title: "Direct Gateway Connect",
                desc: "Hook up your own Razorpay key and secret. Receive payments directly in your bank account with zero middleman commissions."
              },
              {
                icon: <Zap className="w-6 h-6 text-rose-400" />,
                title: "Excel & CSV Importer",
                desc: "Add 100+ students instantly using our spreadsheet template. Upload names, batch lists, mobile numbers, and monthly dues in one click."
              }
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-all flex flex-col gap-4">
                <div className="bg-zinc-950 p-3 rounded-xl w-fit border border-white/5">{f.icon}</div>
                <h3 className="font-bold text-lg text-white">{f.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 px-6 lg:px-16 max-w-6xl mx-auto space-y-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="text-xs uppercase font-bold text-violet-400 tracking-wider">The Bottom Line</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">Get paid on time, without awkward parent conversations</h2>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              Tuition centers and activity schools lose up to 18% revenue just because parents forget to pay, and teachers are too busy to call. 
            </p>
            <div className="space-y-3">
              {[
                "Zero awkward reminder phone calls from teachers.",
                "Fast mobile checkout with UPI, Credit Cards, Netbanking.",
                "Automatic fee status changes in your academy database.",
                "Custom WhatsApp alerts configured to your own wording."
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm">
                  <div className="bg-emerald-500/10 p-1 rounded-full text-emerald-400 border border-emerald-500/20 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-zinc-300 font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-600/10 to-indigo-600/5 p-8 rounded-2xl border border-white/10 flex flex-col gap-6 relative">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
            <h3 className="font-bold text-lg text-white">Why Academies Love Us:</h3>
            <div className="space-y-4">
              {[
                { label: "Chess & Skill Academies", desc: "Batch timing assignments, teacher rosters, and simple payment links mapped to custom entry ELO/levels." },
                { label: "Music & Dance Academies", desc: "Individual monthly rates, easy parent WhatsApp coordination, and daily attendance logging." },
                { label: "Tuition & Coaching Centers", desc: "Defaulter logs, custom overdue filters, collection percentage metrics, and CSV templates." }
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-zinc-950/80 border border-white/5">
                  <div className="font-bold text-violet-400 text-sm mb-1">{item.label}</div>
                  <div className="text-xs text-zinc-400 leading-normal">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-zinc-950/30 border-t border-white/5 px-6 lg:px-16">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-white">Loved by academy administrators</h2>
            <p className="text-zinc-400 text-sm">Hear how local coaches are saving administrative hours and increasing cashflow.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col justify-between gap-6 relative">
                <div className="space-y-4">
                  <div className="flex gap-1">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4.5 h-4.5 text-amber-500 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-zinc-300 text-sm italic leading-relaxed">"{t.content}"</p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg">{t.avatar}</div>
                  <div>
                    <div className="font-bold text-sm text-white">{t.name}</div>
                    <div className="text-[10px] text-zinc-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 lg:px-16 max-w-6xl mx-auto space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Fair, simple pricing for every size</h2>
          <p className="text-zinc-400 text-sm sm:text-base">Start with our free trial. Upgrade as your student headcount expands. Cancel anytime.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              plan: "14-Day Free Trial",
              price: "₹0",
              period: "no credit card needed",
              desc: "Test out the entire platform with full feature access.",
              features: ["Up to 10 Students", "1 Active Teacher Account", "Mock Payment Link simulator", "WhatsApp Logs tracker", "Setup Wizard Onboarding"],
              cta: "Start Free Trial",
              link: "/signup",
              popular: false
            },
            {
              plan: "Growth Plan",
              price: "₹1,499",
              period: "/ month billed monthly",
              desc: "Perfect for growing local tuition and skill academies.",
              features: ["Up to 150 Students", "3 Teacher Accounts", "Razorpay Production Gateways", "Automated WhatsApp API Outbox", "Monthly Recovery Dashboard", "PDF/Excel report exports"],
              cta: "Start 14-Day Trial",
              link: "/signup",
              popular: true
            },
            {
              plan: "Enterprise",
              price: "₹2,999",
              period: "/ month billed monthly",
              desc: "Best for multi-branch institutes and large dance studios.",
              features: ["Unlimited Students", "Unlimited Teacher Accounts", "Dedicated support ticketing", "Custom WhatsApp templates", "Full automated analytics report suite", "Staff permissions module"],
              cta: "Start 14-Day Trial",
              link: "/signup",
              popular: false
            }
          ].map((card, i) => (
            <div 
              key={i} 
              className={`p-6 rounded-2xl flex flex-col justify-between gap-6 relative transition-all ${
                card.popular 
                  ? 'bg-gradient-to-b from-violet-950/30 to-zinc-950/90 border-2 border-violet-500 shadow-xl shadow-violet-950/10' 
                  : 'bg-zinc-900/50 border border-white/5'
              }`}
            >
              {card.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border border-violet-400">
                  Most Popular
                </div>
              )}
              
              <div className="space-y-4">
                <div className="text-zinc-400 font-bold text-xs uppercase tracking-wider">{card.plan}</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white">{card.price}</span>
                  <span className="text-zinc-500 text-xs">{card.period}</span>
                </div>
                <p className="text-zinc-400 text-xs leading-normal">{card.desc}</p>
                <div className="h-px bg-white/5 my-2" />
                <ul className="space-y-2 text-xs text-zinc-300">
                  {card.features.map((f, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link 
                href={card.link}
                className={`w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm text-center transition-all ${
                  card.popular 
                    ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20' 
                    : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-white/10'
                }`}
              >
                {card.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-zinc-950/40 border-t border-white/5 px-6 lg:px-16">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p className="text-zinc-400 text-sm">Everything you need to know about setting up payment auto-collection.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = faqOpen === idx;
              return (
                <div 
                  key={idx} 
                  className="rounded-xl border border-white/5 bg-zinc-900/30 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setFaqOpen(isOpen ? null : idx)}
                    className="w-full p-4 flex items-center justify-between text-left font-bold text-sm sm:text-base text-zinc-200 hover:text-white transition-colors"
                  >
                    <span>{faq.q}</span>
                    <HelpCircle className={`w-5 h-5 text-zinc-500 transition-transform ${isOpen ? 'rotate-180 text-violet-400' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-0 text-zinc-400 text-xs sm:text-sm border-t border-white/5 bg-zinc-950/40 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 px-6 lg:px-16 text-center max-w-4xl mx-auto relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 space-y-6 bg-zinc-900/40 p-8 sm:p-12 rounded-3xl border border-white/10">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">Ready to recover your tuition fees on autopilot?</h2>
          <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Join hundreds of coaches, chess masters, dance studios and tuition owners who recover payments on time every single month.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link 
              href="/signup" 
              className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-3.5 rounded-xl text-sm transition-all hover:scale-105"
            >
              Get Started for Free
            </Link>
            <Link 
              href="#pricing"
              className="bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-white/10 font-bold px-8 py-3.5 rounded-xl text-sm transition-all"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 bg-zinc-950 py-12 px-6 lg:px-16 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-violet-600/20 p-1.5 rounded-lg text-violet-400 border border-violet-500/20">
              <Zap className="w-4 h-4 fill-violet-400" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">Remind<span className="text-violet-400">Flow</span></span>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            <a href="#features" className="hover:text-zinc-300">Features</a>
            <a href="#pricing" className="hover:text-zinc-300">Pricing</a>
            <a href="/login" className="hover:text-zinc-300">Login</a>
            <a href="/signup" className="hover:text-zinc-300">Signup</a>
          </div>

          <div>
            &copy; 2026 RemindFlow Inc. All rights reserved. Made for coaching institutes worldwide.
          </div>
        </div>
      </footer>

    </div>
  );
}
