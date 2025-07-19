import { IAnalysisResult } from '../models/Analysis';

// Constants for format detection
const FORMAT_INDICATORS = {
  OLD_FORMAT: ['overallScore', 'matchPercentage', 'keywordMatch', 'skillsAnalysis'],
  NEW_FORMAT: ['job_description_validity', 'resume_eligibility', 'score_out_of_100', 'chance_of_selection_percentage']
};

// New frontend-expected format
export interface FrontendAnalysisResult {
  // Python server response structure
  job_description_validity: string;
  resume_validity: string;
  validation_error?: string;
  resume_eligibility: string;
  score_out_of_100: number;
  short_conclusion: string;
  chance_of_selection_percentage: number;
  resume_improvement_priority: string[];
  overall_fit_summary: string;
  resume_analysis_report: {
    candidate_information: {
      name: string;
      position_applied: string;
      experience_level: string;
      current_status: string;
    };
    strengths_analysis: {
      technical_skills: string[];
      project_portfolio: string[];
      educational_background: string[];
    };
    weaknesses_analysis: {
      critical_gaps_against_job_description: string[];
      technical_deficiencies: string[];
      resume_presentation_issues: string[];
      soft_skills_gaps: string[];
      missing_essential_elements: string[];
    };
    section_wise_detailed_feedback: {
      contact_information: {
        current_state: string;
        strengths: string[];
        improvements: string[];
      };
      profile_summary: {
        current_state: string;
        strengths: string[];
        improvements: string[];
      };
      education: {
        current_state: string;
        strengths: string[];
        improvements: string[];
      };
      skills: {
        current_state: string;
        strengths: string[];
        improvements: string[];
      };
      projects: {
        current_state: string;
        strengths: string[];
        improvements: string[];
      };
      missing_sections: {
        certifications: string;
        experience: string;
        achievements: string;
        soft_skills: string;
      };
    };
    improvement_recommendations: {
      immediate_resume_additions: string[];
      immediate_priority_actions: string[];
      short_term_development_goals: string[];
      medium_term_objectives: string[];
    };
    soft_skills_enhancement_suggestions: {
      communication_skills: string[];
      teamwork_and_collaboration: string[];
      leadership_and_initiative: string[];
      problem_solving_approach: string[];
    };
    final_assessment: {
      eligibility_status: string;
      hiring_recommendation: string;
      key_interview_areas: string[];
      onboarding_requirements: string[];
      long_term_potential: string;
    };
  } | null;
  
  // Metadata for compatibility with existing frontend
  id?: string;
  analysisId?: string;
  resumeFilename?: string;
  jobDescriptionFilename?: string;
  jobTitle?: string;
  industry?: string;
  analyzedAt?: Date;
  processingTime?: number;
}

export class ResultTransformer {
  /**
   * Transform old database format to new frontend format
   */
  public static transformToFrontendFormat(
    oldResult: IAnalysisResult,
    metadata?: {
      id?: string;
      analysisId?: string;
      resumeFilename?: string;
      jobDescriptionFilename?: string;
      analyzedAt?: Date;
      processingTime?: number;
    }
  ): FrontendAnalysisResult {
    // Extract strengths from various sources with null safety
    const technicalSkills = oldResult.candidateStrengths || [];
    const projectPortfolio = oldResult.skillsAnalysis?.technical?.present || [];
    const educationalBackground = oldResult.skillsAnalysis?.industry?.present || [];

    // Extract weaknesses from various sources with null safety
    const criticalGaps = oldResult.skillsAnalysis?.technical?.missing || [];
    const technicalDeficiencies = oldResult.experienceAnalysis?.experienceGaps || [];
    const presentationIssues = oldResult.resumeQuality?.formatting?.issues || [];
    const softSkillsGaps = oldResult.skillsAnalysis?.soft?.missing || [];
    const missingElements = oldResult.resumeQuality?.structure?.missingSections || [];

    // Extract all strengths and weaknesses from detailedFeedback with null safety
    const getAllStrengths = (): string[] => {
      return oldResult.detailedFeedback?.strengths?.flatMap(s => s.points || []) || [];
    };

    const getAllWeaknesses = (): string[] => {
      return oldResult.detailedFeedback?.weaknesses?.flatMap(s => s.points || []) || [];
    };

    // Extract section-wise feedback from detailedFeedback with improved null safety
    const extractSectionFeedback = (sectionName: string) => {
      // Map section names to possible category keywords
      const categoryMappings: { [key: string]: string[] } = {
        'contact': ['contact', 'information', 'personal'],
        'profile': ['profile', 'summary', 'objective', 'overview'],
        'education': ['education', 'academic', 'degree', 'university', 'college'],
        'skills': ['technical', 'skills', 'programming', 'technology'],
        'projects': ['project', 'portfolio', 'work', 'development']
      };
      
      const keywords = categoryMappings[sectionName] || [sectionName];
      
      const strengths = oldResult.detailedFeedback?.strengths?.find(s => 
        keywords.some(keyword => s.category?.toLowerCase().includes(keyword))
      )?.points || [];
      
      const weaknesses = oldResult.detailedFeedback?.weaknesses?.find(w => 
        keywords.some(keyword => w.category?.toLowerCase().includes(keyword))
      )?.points || [];
      
      // If no specific section data found, use general strengths/weaknesses
      const finalStrengths = strengths.length > 0 ? strengths : getAllStrengths().slice(0, 2);
      const finalWeaknesses = weaknesses.length > 0 ? weaknesses : getAllWeaknesses().slice(0, 2);
      
      return {
        current_state: `${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} section present`,
        strengths: finalStrengths,
        improvements: finalWeaknesses
      };
    };

    // Extract skills section feedback with improved null safety
    const extractSkillsFeedback = () => {
      const technicalStrengths = oldResult.detailedFeedback?.strengths?.find(s => 
        s.category?.toLowerCase().includes('technical')
      )?.points || [];
      
      const technicalWeaknesses = oldResult.detailedFeedback?.weaknesses?.find(w => 
        w.category?.toLowerCase().includes('technical') || w.category?.toLowerCase().includes('critical')
      )?.points || [];
      
      return {
        current_state: "Skills section available",
        strengths: technicalStrengths.length > 0 ? technicalStrengths : (technicalSkills.length > 0 ? technicalSkills : getAllStrengths().slice(0, 3)),
        improvements: technicalWeaknesses.length > 0 ? technicalWeaknesses : (criticalGaps.length > 0 ? criticalGaps : getAllWeaknesses().slice(0, 3))
      };
    };

    // Extract projects section feedback with improved null safety
    const extractProjectsFeedback = () => {
      const projectStrengths = oldResult.detailedFeedback?.strengths?.find(s => 
        s.category?.toLowerCase().includes('project') || s.category?.toLowerCase().includes('portfolio')
      )?.points || [];
      
      const projectWeaknesses = oldResult.detailedFeedback?.weaknesses?.find(w => 
        w.category?.toLowerCase().includes('project') || w.category?.toLowerCase().includes('experience')
      )?.points || [];
      
      return {
        current_state: "Projects section present",
        strengths: projectStrengths.length > 0 ? projectStrengths : (projectPortfolio.length > 0 ? projectPortfolio : getAllStrengths().slice(0, 3)),
        improvements: projectWeaknesses
      };
    };

    // Extract improvement recommendations with null safety
    const extractImprovementRecommendations = () => {
      const immediateActions = oldResult.improvementPlan?.immediate?.[0]?.actions || [];
      const shortTermGoals = oldResult.improvementPlan?.shortTerm?.[0]?.actions || [];
      const mediumTermObjectives = oldResult.improvementPlan?.longTerm?.[0]?.actions || [];
      
      return {
        immediate_resume_additions: oldResult.skillsAnalysis?.technical?.recommendations || [],
        immediate_priority_actions: immediateActions,
        short_term_development_goals: shortTermGoals,
        medium_term_objectives: mediumTermObjectives
      };
    };

    // Extract soft skills suggestions with null safety
    const extractSoftSkillsSuggestions = () => {
      const communicationSkills = oldResult.skillsAnalysis?.soft?.recommendations || [];
      const teamworkSkills = oldResult.skillsAnalysis?.soft?.recommendations || [];
      const leadershipSkills = oldResult.skillsAnalysis?.soft?.recommendations || [];
      const problemSolvingSkills = oldResult.skillsAnalysis?.soft?.recommendations || [];
      
      return {
        communication_skills: communicationSkills,
        teamwork_and_collaboration: teamworkSkills,
        leadership_and_initiative: leadershipSkills,
        problem_solving_approach: problemSolvingSkills
      };
    };

    // Extract final assessment with null safety
    const extractFinalAssessment = () => {
      const eligibilityStatus = oldResult.experienceAnalysis?.relevant ? 'Eligible' : 'Not Eligible';
      const hiringRecommendation = oldResult.overallRecommendation || 'Consider for interview';
      const keyInterviewAreas = oldResult.detailedFeedback?.weaknesses?.map(w => w.category) || [];
      const onboardingRequirements = oldResult.skillsAnalysis?.technical?.missing || [];
      const longTermPotential = oldResult.aiInsights?.[0] || 'Good potential for growth';
      
      return {
        eligibility_status: eligibilityStatus,
        hiring_recommendation: hiringRecommendation,
        key_interview_areas: keyInterviewAreas,
        onboarding_requirements: onboardingRequirements,
        long_term_potential: longTermPotential
      };
    };

    // Build the transformed result
    const transformedResult: FrontendAnalysisResult = {
      // Python server response structure
      job_description_validity: 'Valid', // Assume valid for old format
      resume_validity: 'Valid', // Assume valid for old format
      resume_eligibility: oldResult.experienceAnalysis?.relevant ? 'Eligible' : 'Not Eligible',
      score_out_of_100: oldResult.overallScore || 0,
      short_conclusion: oldResult.overallRecommendation || 'Analysis completed',
      chance_of_selection_percentage: oldResult.matchPercentage || 0,
      resume_improvement_priority: oldResult.developmentAreas || [],
      overall_fit_summary: oldResult.aiInsights?.[0] || 'Overall fit assessment completed',
      
      // Detailed analysis report
      resume_analysis_report: {
        candidate_information: {
          name: 'Candidate', // Default name for old format
          position_applied: oldResult.jobTitle || 'Position',
          experience_level: 'Not specified',
          current_status: 'Active'
        },
        strengths_analysis: {
          technical_skills: technicalSkills,
          project_portfolio: projectPortfolio,
          educational_background: educationalBackground
        },
        weaknesses_analysis: {
          critical_gaps_against_job_description: criticalGaps,
          technical_deficiencies: technicalDeficiencies,
          resume_presentation_issues: presentationIssues,
          soft_skills_gaps: softSkillsGaps,
          missing_essential_elements: missingElements
        },
        section_wise_detailed_feedback: {
          contact_information: extractSectionFeedback('contact'),
          profile_summary: extractSectionFeedback('profile'),
          education: extractSectionFeedback('education'),
          skills: extractSkillsFeedback(),
          projects: extractProjectsFeedback(),
          missing_sections: {
            certifications: 'Not specified',
            experience: 'Not specified',
            achievements: 'Not specified',
            soft_skills: 'Not specified'
          }
        },
        improvement_recommendations: extractImprovementRecommendations(),
        soft_skills_enhancement_suggestions: extractSoftSkillsSuggestions(),
        final_assessment: extractFinalAssessment()
      },
      
      // Metadata
      id: metadata?.id,
      analysisId: metadata?.analysisId,
      resumeFilename: metadata?.resumeFilename,
      jobDescriptionFilename: metadata?.jobDescriptionFilename,
      jobTitle: oldResult.jobTitle,
      industry: oldResult.industry,
      analyzedAt: metadata?.analyzedAt,
      processingTime: metadata?.processingTime
    };

    return transformedResult;
  }

  /**
   * Check if result is in old format (database format)
   */
  public static isOldFormat(result: any): boolean {
    if (!result || typeof result !== 'object') {
      return false;
    }
    
    // Check for old format indicators
    const hasOldFormatIndicators = FORMAT_INDICATORS.OLD_FORMAT.some(indicator => 
      result.hasOwnProperty(indicator)
    );
    
    // Check for absence of new format indicators
    const hasNewFormatIndicators = FORMAT_INDICATORS.NEW_FORMAT.some(indicator => 
      result.hasOwnProperty(indicator)
    );
    
    return hasOldFormatIndicators && !hasNewFormatIndicators;
  }

  /**
   * Check if result is in new format (Python API format)
   */
  public static isNewFormat(result: any): boolean {
    if (!result || typeof result !== 'object') {
      return false;
    }
    
    // Check for new format indicators
    const hasNewFormatIndicators = FORMAT_INDICATORS.NEW_FORMAT.some(indicator => 
      result.hasOwnProperty(indicator)
    );
    
    return hasNewFormatIndicators;
  }
} 