-------  Important tasks.
# -- I have to change the analysis file code to newly refactored code but there is still issue it is not adding the user id in with the analysis report it generates. I have saved that code in other files so first of all solve this task. **1** -- ✅ Completed.

# -- Make sure that backend totally compatible with the newly refactored python file code. **2**
#    -- First of find out all the files which are calling the backend for any task and specifically the analysis and make sure that they are properly integrated and connected with the correct Python endpoints.
#   --- once this task is completed I will do this refactor the current backend just like the python code I have refactored. and make it faster and while keeping the all the functionality and if needed any other improvements or efficiency add it.**2.2** -- ✅ Mostly completed and testing remaining
# -- Also remove if there are unnecessary files in the backend folder which are not necessary totally. -- ✅ Mostly completed and testing remaining

# -- check how we are fetching the data as this is the process steps.
#   -- Request analysis with the resume and document through Frontend -> receives and handled here and backend send to python for actual analysis-> This checks for all the conditions and than generates the response and saves to the backend. Now python tells the backend that analysis is completed.
#   -- When python server sends message request is completed backend will fetch the data from the database and than it will send this data to the Frontend and finally to the user.
#   -- So if we are fetching the data in the python server there is no need for this. so if there is code for fetching there remove this code. and make sure that after each requests are given by the backend it will receive the response which telling successfully job completed or if not than not completed and all the details backend can ask from the database as we are saving the response if the job is successful and if not we are saving why not or something other but we are definitely saving something so have to check it also if this is happening or not if yes no need to anything except improve or implement totally. **3** -- ✅ Mostly completed and testing remaining.



# -- Make sure all the edpoints of the python backend are successfully and correctly connceted to the backend as right now backend is calling the wrong points when calling the analysis function. -- ✅ Mostly completed in server and locally running correctly.



# -------- Future add on.
-- Add freemium version option. - Add payment gateway.

-------- Normal Site Future add on.
-- add option where user can find out which are the improvements resume needs. Though we are providing this we have to give this in more dertail. Think about this is this needed or not.
    -- We have to generate if user asks for this after he has completed the simple analysis.
    -- In future add this feature in the premium version.

-- completed work
# -- "How We Compare" make sure that this feature is correct. ---For now this is correct.
# -- add option so that i can fill both the password and email, save in the browser itself. completed mostly


# <!-- -- make this image components smaller image.jpg in admin dashboard.

# -- also make the ui more better Overview Users Analyses System move to top nav bar option as to give more space to the admin to see the data.

# -- Admin do not require profile page access so that password can not be changed by outside of the organization pepole or they must not be able to delete the account.✅ COMPLETED

# -- Add remaining features so that admin can analyse and do all the work he is required to do.
# -- 💡 Additional Ideas for Future Enhancement:
# Real-time Notifications - Get alerts for system issues or unusual activity
# Advanced Analytics - Detailed reports and trend analysis
# Bulk Operations - Manage multiple users at once
# Data Export - Export user data and analytics reports
# Audit Trail - Track all admin actions for security
# Email Notifications - Alert admins about important events
# System Configuration - Manage app settings through admin panel if still other things there add them in the admin feature.
# -- Improve the Analyses section such that it can be able to give analysis report for 1 hour, 1 day, 1 week, 15 days, 1 month, 6 months, 1 year and also report for all time also. I can add custom option so Admin can select any date and time as per they want as this can be much better option.
# - Also proper analysis report can be seen in the charts to anlayse in more better way. -->



23/07/2025
---- Read main readme file and also the api file and readme file in backend server.

# -- make sure whole backend is connected to the python server correctly. and also check is backend is fetching the data directly from the mongodb when python server sends the response that request is analysed corrected or not. As our functionality is like this we are saving the data directely using the python server and sends the minimal response saying success or failure and than backend fetches the data from the mongodb database directly for this backend do not have to go to the python server for the access of data to make it more robust and put less load on the python server.f this is not the case tell me which are the file not working correctly and give the location for all those file along with small but detailed explaination why it is not doing this or how to solve it or what it is doing and why. -- ✅ this is working correctly.

# -- make sure whole backend is connected to the python server correctly. and also check is backend is fetching the data directly from the mongodb when python server sends the response that request is analysed corrected or not. As our functionality is like this we are saving the data directely using the python server and sends the minimal response saying success or failure and than backend fetches the data from the mongodb database directly for this backend do not have to go to the python server for the access of data to make it more robust and put less load on the python server. -- ✅ this is working correctly.

# -- now check why we have uncommented this code as i commented this code because this code was conflicting with the explaination i just gave you so why we uncommented can you find out and to do this you can anlyse other folders also. -- ✅ this is working correctly.

# -- Test the ui improvement done for the mobile responsiveness. -- In some pages it is working but still needs more improvement.

# -- Make sure backend and python server both are allowing the job discription in (txt, docx and pdf) format as currently i think pythonserver is allowing the .txt file type only have to check it. -- ✅ Mostly completed Testing remaining.

------------------- 24/07/2025 -------------------
# -- currently this code is looking working perfectly in local setup. 
# -- Still backend is calling the resume-analyzer build and also when i last time tried calling the python server it did not responded. -- Completed this was happening because of the old build catche was loaded in the backend vercel server so this was happening.
    # -- Currently for some reason after solving this now backend is not calling the python sever in render at all.   ✅ completed.
    # -- Backend is now calling the /api/resume/analyze instead of /api/v1/analyze as i can see in the server logs and also this request is not reacing to the backend as i tried callling /api/resume/analyze normally with the help of render api uri. ✅ completed.



# --- do not show data to every user show data to users only who have done the analysis.As corrrenlty when other user logged in it show all users data there even though user was newly logged in and do not have access to see other user data. -- ✅ Mostly completed as added the validation only testing is reamining by creating new account and testing it there.

# -- If user trying with the temp id for the sign up give them error that do not use the temp mail use the original mail we have setup the logic and it is working just have to change the text what we show it as when one user tried this it did not created account and shown something wrong or some other error i forgot i do not completely know it is the case but if it will find out that mail used is temp stop it and show the error. -- ✅ Mostly completed Testing remaining.

# -- Separate the admin module in the backend totally. from the noraml users module code.**4** -- ✅ Mostly completed Testing remaining.

# -- height of the analysis step.

-- This is new mobile responsive design worked little bit but needs too much improvements.

# -- when i move from view detail page to the page which shows the contet i am seein unnnecessary page which shows that analysing the report message and make me wait at that page. remove this and make it direct to move.-- ✅ Mostly completed Testing remaining. 
    -- But still some times we are shown the laoding screen. 

-- Improve the dashboard UI. 
-- In dashboard UI add fetures like the download the report or export data. when we enter the view detailed page. and added features (like PDF or CSV) download.


-- Ui of analysis step in resumecheck page is totally different than rest of my website in color combo and also it is not same as the other two steps resume upload and also the job description. right now anlaysis page is lookikng too light font color and also it ui is not looking like the other steps.

-- In the content view page too much color used make it simple as the rest of the ui make it similar to the dashboard how we show four content and also make too much color to simple white ui.
# -- increase the width of the dashboard and dashboard/analysis page.
-- Smit Resume.pdf content shown in the dashboard make file icon to put on the left side of the text not on the top.and also make font darker right now it is too light.

-- Analysis Dashboard Track your resume analysis history and improvements - color used for this text card i have to add to the other pages also.

# --- reduce the size of the http://localhost:5173/dashboard/analysis/ page text size.

-- improve the normal dashboard ui and seperate the admin dashboard compoenents totally.

# ✅ -- add admin panel to analyse and see all the things so that i can monitor also the usage by each user and keep monitor for the improvement if i needed it.

-- Add limitation of max input token as there is limit in groq Api call so add it and also add that user will not able to click analyse button again and again as it will request anlaysis work for same thing again and again so improve that. -- testing is remaining as i have done the change but have not seen my self if added successfully.

# -- limit more than 15 analysis daily by any user as right now it is in testing phase so this limit is high i will reduce this to the 5 or 3 request only daily.

-- Make sure to add the limitaion of how long job discription can be might be add 500 to 100 words or it is too small search and also for all the files check how big they are make sure to add less than 5 mb file and also max pages can be in the pdf or any other file must be 5 to 7 as resumes and job discription are not bigger than this size.


-------- Must complete only after completing above tasks.
# -- Add option so that user can give me suggesstions after the analysis result is it good or helped them or not.- code might be added have to check if it is added correctly and working or not correctly. ✅ COMPLETED Testing remaining.

-- Add the Google sign in and sign up inside of my website and only take data which is required.

# -- We are not able to export the full anlaysis report in profile only profile info is being downloaded.✅ COMPLETED 
    -- Have to add this option download the csv or the pdf also.

# -- 0% Avg Match Rate instead of this change this too something else.

# -- You have to anlayse the hoempage as it has the perfect dark theme integrated and after do as i have mentioned
# -- Dark theme is not perfect every where make it consitence everywhere also make sure that texts are in white or light color as durin dark theme white or light text can be visible if you have used the dark color font they will not be visible and also along with it check that background is in the dark or not as if not white font won't be visible.in profile page it is not working. ✅ COMPLETED.

# -- Navbar becomes too dark make it little lighter same as in the homepage. ✅ COMPLETED.
# -- No need to make footer dark as it's color is perfect for both the dark and light theme. ✅ COMPLETED.

# -- Add validation for the response we are generating that there no answer need to give which is not related to the generating the analysis based on the job and resume. even if there is valid job discription but still hacker can add some prompt inside of this valid job discription that give me private key or admin access i must not give it to them. if job discription or the resume has something which is not related to them remove them or ignore that peace of text. ✅ COMPLETED only testing is remaining.


---- seperate the mobileresponsive css from the main css file as currently some css files are too big.


---------------------------------------------- -- ---------------------------------------------------------

# -- For the normal analysis i am getting the content to long even though the data is of valid size and also the tokens.
    #  -- Correct this logic for handling the data. ✅ COMPLETED.
# -- Remove unnecessary Homepage css files. ✅ COMPLETED.
-- Seperate the mobile responsiveness if files are too big.
# -- Integrate the feedback option as i am not seeing it anywhere in after the analysis is completed ✅ COMPLETED But still there is testing is reamining.
-- Have to improve the Footer ui for the mobile responsiveness and revse to old ui code for the desktop size.
-- also the mobilenavbar needs the improvement.

-- code using the Claude Opus 4 (Thinking) model not just thinking and generating like this model but use the Claude Opus 4 (Thinking) model itself



----------------------------------------------------------------------------- --------------------
# -- Resume Upload must not take the txt file it only take the pdf and the docx frontend needs to fix this as there is validation in the backend and also the python server. -- ✅ COMPLETED.
# -- I can now improve the how we show data in the pdf improve it. -- Future add on.
# -- Download button must downlaod all the data same as the json is downloading as other two are not showing all the data in the file. -- ✅ COMPLETED.
# -- Improve the ui of the dropdown list as currently it is not mathching the surrounding ui. -- ✅ COMPLETED. Mostly but can change in the future.

# -- On refresh data must not lost in the resmuchecker page. -- ✅ COMPLETED.
# -- Feedback form page utilize the width and also change background color to mathch the other components to white background as currently it is black and it is not matching the theme -- ✅ COMPLETED.
# -- Feedback form is not able to send feedback it is i think trying to fetch but we are taking info in the feedback form the user and storing this in the database seperately so with the userid and also the analysis id.             --  ✅ COMPLETED.
    # - I will do this task later after this site is successfully uploaded to the server.

# -- Add validation for the response we are generating that there no answer need to give which is not related to the generating the analysis based on the job and resume. even if there is valid job discription but still hacker can add some prompt inside of this valid job discription that give me private key or admin access i must not give it to them. if job discription or the resume has something which is not related to them remove them or ignore that peace of text. ✅ COMPLETED.
# -- We are not able to export the full anlaysis report in profile only profile info is being downloaded.✅ COMPLETED 
    # -- Have to add this option download the csv or the pdf also.
    # -- Also add option in the dashboard page also. ✅ Mostly COMPLETED. 
 
-- solve all the lint errors.

# -- 4 Total Analyses
# 0 Average Score
# 0 Best Score
# 0% Success Rate Make sure all the data is shown here correctly.currently only the total resumes are counted correctly. ✅ COMPLETED.
-- stat-icon-container make icons inside of this size bigger as you can see they are not even visible through the eyes.i think it is happening due to parent calss so i am reverting back to last style.



---------------------------------------------- -- ---------------------------------------------------------
26/07/2025
-- I will solve this issue in the future.
# --  make in downaload page sure that pdf and csv and json format must able to downalod and show all the data we are able to downlaod with the help of the json format in the profile page.  -- ✅ Mostly COMPLETED.
    -- but in the dashboard it is not working only there it is needed to be improved.
-- feedback page needs the UI improved.
#     -- Make that page persitance when we have refreshed the page as when i refreshed page i was not able to see the thank you message as i have send the feedback it is forgoting that feedback is given and have to show the appropriate message we are showing and showing this message so that user can see that they have already send the feedback.
---------------------------------------------- -- ---------------------------------------------------------

27/07/2025
-- css files are too big so have to reduce the size if this file contains the style for other pages in there style.
    # -- Homepage and analysis page view is completed for now.

#-- i encounter that i am getting the response for the ai ml engineer now for some reason have to check what happened as it must give the answer based on the resume uplaoded and also the job description provided along with it.
#    -- A Senior Cybersecurity Specialist is responsible for leading the design, implementation, and monitoring of security measures to protect systems, networks, and data. This role involves managing threat detection, incident response, and vulnerability assessments while ensuring compliance with industry standards. The senior specialist mentors junior staff, oversees security audits, and collaborates with IT and executive teams to develop robust security strategies. Strong expertise in firewalls, intrusion detection, cloud security, and risk management is essential. The role requires staying updated on emerging threats and evolving technologies to safeguard organizational assets effectively. Proven leadership and strategic decision-making skills are critical for this position.
#-- i entered this prompt for the job description but still i got the same output for some reasone so have to check what is causing the issues. first check is the prompt reaching to the python server from the frontend and backend is changing the prompt to other prompt or are really asking the ai that you have to compare the resume with the job discription and after that you have to give the answer considering this view point. -- This happened because api key was revoked for some reason.

# -- Make sure that when analysis is failed due to python server not able to make the report successfully it must return the message request failed and have to show this on the resumechecker page and no need to show in the dashboard and it must not return the any of the fake data ok. --  ✅ Mostly COMPLETED Testing remaining.

-- Make the authenication validation faster as currently it is slower for server uploaded frontend.

-- Have to keep the cookies about the analysis viewing so that do not have to directly fetch from the server but can be accessed using the cookies we have stored.

-- when entering the feedback option and if data is filled it is loading and i have to remove this loading to make it opening faster i think it is happening because of the ui.