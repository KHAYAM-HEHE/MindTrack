import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import HTMLtoJSX from "htmltojsx";

const root = process.cwd();
const htmlDir = path.join(root, "..", "frontendhtml");
const converter = new HTMLtoJSX({ createClass: false });

const mappings = [
  {
    html: "11_Client_Dashboard.html",
    out: "src/pages/client/ClientDashboardPage.jsx",
    component: "ClientDashboardPage",
    type: "dashboard",
  },
  {
    html: "05_Professional_Dashboard.html",
    out: "src/pages/psychiatrist/PsychiatristDashboardPage.jsx",
    component: "PsychiatristDashboardPage",
    type: "dashboard",
  },
  {
    html: "06_HR_Operations__Verification.html",
    out: "src/pages/hr/HrDashboardPage.jsx",
    component: "HrDashboardPage",
    type: "dashboard",
  },
  {
    html: "29_Admin_Moderation_Dashboard.html",
    out: "src/pages/admin/AdminDashboardPage.jsx",
    component: "AdminDashboardPage",
    type: "dashboard",
  },
  {
    html: "32_Product_Experience_Blueprint__Design_Spec.html",
    out: "src/pages/owner/OwnerDashboardPage.jsx",
    component: "OwnerDashboardPage",
    type: "dashboard",
  },
  {
    html: "23_MindWell_Sign_Up__Onboarding.html",
    out: "src/pages/onboarding/ClientOnboardingPage.jsx",
    component: "ClientOnboardingPage",
    type: "onboarding",
    role: "CLIENT",
  },
  {
    html: "14_Professional_Verification_Onboarding.html",
    out: "src/pages/onboarding/PsychiatristOnboardingPage.jsx",
    component: "PsychiatristOnboardingPage",
    type: "onboarding",
    role: "PROFESSIONAL",
  },
  {
    html: "06_HR_Operations__Verification.html",
    out: "src/pages/onboarding/HrOnboardingPage.jsx",
    component: "HrOnboardingPage",
    type: "onboarding",
    role: "HR",
  },
  {
    html: "21_Role__Permission_Management.html",
    out: "src/pages/onboarding/AdminOnboardingPage.jsx",
    component: "AdminOnboardingPage",
    type: "onboarding",
    role: "ADMIN",
  },
  {
    html: "32_Product_Experience_Blueprint__Design_Spec.html",
    out: "src/pages/onboarding/OwnerOnboardingPage.jsx",
    component: "OwnerOnboardingPage",
    type: "onboarding",
    role: "OWNER",
  },
];

function indent(str, spaces = 2) {
  const pad = " ".repeat(spaces);
  return str
    .split("\n")
    .map((line) => `${pad}${line}`)
    .join("\n");
}

for (const map of mappings) {
  const htmlPath = path.join(htmlDir, map.html);
  const raw = fs.readFileSync(htmlPath, "utf8");
  const $ = load(raw, { decodeEntities: false });
  const body = $("body");
  const bodyClass = body.attr("class") || "";
  const bodyStyle = body.attr("style");
  const contentHtml = body.length ? body.html() || "" : $.root().html() || "";
  const wrapperOpen = bodyStyle ? `<div class="${bodyClass}" style="${bodyStyle}">` : `<div class="${bodyClass}">`;
  const wrappedHtml = `${wrapperOpen}${contentHtml}</div>`;
  const jsxMarkup = converter.convert(wrappedHtml);

  let source = "";
  if (map.type === "dashboard") {
    source = `export default function ${map.component}() {
  return (
${indent(jsxMarkup, 4)}
  );
}
`;
  } else {
    source = `import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { markOnboardingComplete, roleDashboardPath } from "../../lib/onboarding";

export default function ${map.component}() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const onFinish = () => {
    markOnboardingComplete(user);
    navigate(roleDashboardPath("${map.role}"));
  };

  return (
    <div className="relative">
${indent(jsxMarkup, 6)}
      <button
        className="fixed bottom-5 right-5 rounded-xl bg-[#00685f] px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#006a61]"
        onClick={onFinish}
      >
        Complete Onboarding
      </button>
    </div>
  );
}
`;
  }

  const outPath = path.join(root, map.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, source, "utf8");
}

console.log(`Generated ${mappings.length} exact role pages.`);

