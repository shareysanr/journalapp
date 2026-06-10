import { Link } from "react-router-dom";

const features = [
  {
    title: "Daily Journal Entries",
    description:
      "Record goals, distractions, ratings, and notes to build a history of your productivity."
  },
  {
    title: "Weekly AI Report",
    description:
      "Automatically generated summaries highlighting accomplishments, missed goals, and recurring patterns."
  },
  {
    title: "Personalized Recommendations",
    description:
      "Receive actionable suggestions based on your weekly habits and productivity trends."
  }
];

export default function LandingPage() {
  return (
    <div>
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            Personal growth journal
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Reflect daily. Understand your week.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Track daily goals, identify recurring distractions, and receive AI-generated weekly
            reports with personalized recommendations.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Get started
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:grid-cols-3 sm:px-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-slate-200 bg-slate-50 p-6"
            >
              <h2 className="text-lg font-semibold text-slate-900">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
