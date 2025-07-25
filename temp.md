------- Important tasks

#  -- [✅ Done] Change analysis file code to newly refactored code and ensure user id is added with the analysis report.

 -- [🟡 Partially Done] Make backend fully compatible with newly refactored python code.

 -- [🟡 Partially Done] Check all files calling backend for analysis and ensure correct Python endpoints are used.

 -- [🟡 Partially Done] Refactor backend for speed/efficiency after above is done.

 -- [🟡 Partially Done] Remove unnecessary files in backend folder.

 -- [🟡 Partially Done] Data fetching process: Backend should fetch from MongoDB after python server signals completion. Remove any unnecessary data fetching in python server. (Testing remaining)

 -- [🟡 Partially Done] Ensure all python backend endpoints are correctly connected to backend (analysis function). (Locally running correctly, testing remaining)

#  -- [✅ Done] Backend fetches analysis data directly from MongoDB after python server signals completion. (Robust, less load on python server)

#  -- [✅ Done] Code conflict (uncommented code) resolved as per above logic.

 -- [🟡 Partially Done] Test UI improvements for mobile responsiveness.

 -- [⏳ Pending] Add file/code style guide for consistency (e.g., camelCase in DB, etc.)

 -- [✅ Done] Backend and python server both allow job description in pdf, docx, and txt formats. (Confirmed in python_server/app/config.py)

 -- [🟡 Partially Done] Do not show analysis data to users who have not done analysis. (Validation added, needs more testing)

 -- [⏳ Pending] If user tries to sign up with temp mail, show clear error message (logic exists, improve error text)

 -- [⏳ Pending] Separate admin module in backend from normal user code.

 -- [⏳ Pending] Remove unnecessary 'analyzing report' wait page when moving from view detail to content page.

 -- [⏳ Pending] Improve dashboard UI, add download/export report feature.

 -- [⏳ Pending] Improve analysis page UI (color, width, file icon placement, font, etc.)

 -- [⏳ Pending] Add max input token limit for Groq API, prevent repeated analysis requests. (Code added, needs testing)

 -- [⏳ Pending] Limit daily analysis requests per user (reduce from 15 to 5 or 3 for production)

 -- [⏳ Pending] Add/validate limits: job description length (500-1000 words), file size (<5MB), max pages (5-7), etc.

 -- [⏳ Pending] Add Google sign-in/sign-up (only required data)

 -- [⏳ Pending] Export full analysis report in profile (currently only profile info is downloaded)

 -- [⏳ Pending] Change '0% Avg Match Rate' to something else

 -- [⏳ Pending] Make dark theme consistent everywhere (dashboard/analysis, navbar, footer, etc.)

 -- [⏳ Pending] Add validation to prevent prompt injection in job description/resume (logic added, needs more testing)

 -- [⏳ Pending] Separate mobile responsive CSS from main CSS if files are too big

 -- [⏳ Pending] Improve Footer UI for mobile, revert to old UI for desktop

 -- [⏳ Pending] Improve mobile navbar

 -- [⏳ Pending] Use Claude Opus 4 (Thinking) model for analysis

 -- [⏳ Pending] Add login/sign up with Google authentication

 -- [✅ Done] Remove unnecessary homepage CSS files

 -- [✅ Done] Integrate feedback option after analysis (testing remaining)

 -- [✅ Done] Add admin panel for monitoring usage and improvements

 -- [✅ Done] Add option for user to give suggestions after analysis result

 -- [✅ Done] Add validation to not show unrelated answers in analysis (testing remaining)

 -- [✅ Done] Fix 'content too long' logic for normal analysis

-------- Future/Optional Features --------

 -- [⏳ Pending] Add freemium version/payment gateway

 -- [⏳ Pending] Add option for user to see resume improvement suggestions

 -- [⏳ Pending] Enhanced analytics & reporting (time-based filtering, advanced charts, trend analysis, export, etc.)

 -- [⏳ Pending] Real-time features (notifications, WebSocket, activity monitoring, system alerts)

 -- [⏳ Pending] Advanced user management (bulk ops, analytics, recovery, logs)

 -- [⏳ Pending] System admin (audit trail, config, backup, performance, error tracking)

 -- [⏳ Pending] Data management (export/import, cleanup, storage monitoring)

 -- [⏳ Pending] Security enhancements (admin logging, IP whitelist, session mgmt, alerts)

 -- [⏳ Pending] Communication features (email, messaging, announcements, support)

 -- [⏳ Pending] Advanced analytics (ML insights, predictions, custom reports, viz)

 -- [✅ Done] How We Compare feature

 -- [✅ Done] Admin cannot access profile page/change password/delete account

 -- [✅ Done] Save password/email in browser (mostly done)
