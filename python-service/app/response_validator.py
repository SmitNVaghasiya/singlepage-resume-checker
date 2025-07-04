import json
import logging
from typing import Dict, Any, List, Tuple, Optional
from pydantic import ValidationError
from .models import ResumeAnalysisResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ResponseValidator:
    """
    Comprehensive validator to ensure AI responses match the exact schema structure
    """
    
    @staticmethod
    def validate_required_fields(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate that all required top-level fields are present
        """
        required_fields = [
            "job_description_validity",
            "resume_eligibility", 
            "score_out_of_100",
            "short_conclusion",
            "chance_of_selection_percentage",
            "resume_improvement_priority",
            "overall_fit_summary",
            "resume_analysis_report"
        ]
        
        missing_fields = []
        for field in required_fields:
            if field not in data:
                missing_fields.append(field)
        
        return len(missing_fields) == 0, missing_fields
    
    @staticmethod
    def validate_data_types(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate that field data types match expected schema
        """
        type_errors = []
        
        # String fields
        string_fields = ["job_description_validity", "resume_eligibility", "short_conclusion", "overall_fit_summary"]
        for field in string_fields:
            if field in data and not isinstance(data[field], str):
                type_errors.append(f"{field} must be a string, got {type(data[field])}")
        
        # Integer fields
        int_fields = ["score_out_of_100", "chance_of_selection_percentage"]
        for field in int_fields:
            if field in data and not isinstance(data[field], int):
                type_errors.append(f"{field} must be an integer, got {type(data[field])}")
        
        # Array fields
        if "resume_improvement_priority" in data and not isinstance(data["resume_improvement_priority"], list):
            type_errors.append(f"resume_improvement_priority must be an array, got {type(data['resume_improvement_priority'])}")
        
        return len(type_errors) == 0, type_errors
    
    @staticmethod
    def validate_nested_structure(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate nested resume_analysis_report structure
        """
        structure_errors = []
        
        if "resume_analysis_report" not in data:
            return False, ["resume_analysis_report is missing"]
        
        report = data["resume_analysis_report"]
        if not isinstance(report, dict):
            return False, ["resume_analysis_report must be an object"]
        
        # Required nested sections
        required_sections = [
            "candidate_information",
            "strengths_analysis", 
            "weaknesses_analysis",
            "section_wise_detailed_feedback",
            "improvement_recommendations",
            "soft_skills_enhancement_suggestions",
            "final_assessment"
        ]
        
        for section in required_sections:
            if section not in report:
                structure_errors.append(f"resume_analysis_report.{section} is missing")
                continue
            
            if not isinstance(report[section], dict):
                structure_errors.append(f"resume_analysis_report.{section} must be an object")
        
        # Validate candidate_information fields
        if "candidate_information" in report:
            candidate_info = report["candidate_information"]
            required_candidate_fields = ["name", "position_applied", "experience_level", "current_status"]
            for field in required_candidate_fields:
                if field not in candidate_info:
                    structure_errors.append(f"candidate_information.{field} is missing")
                elif not isinstance(candidate_info[field], str):
                    structure_errors.append(f"candidate_information.{field} must be a string")
        
        # Validate strengths_analysis arrays
        if "strengths_analysis" in report:
            strengths = report["strengths_analysis"]
            required_strength_arrays = ["technical_skills", "project_portfolio", "educational_background"]
            for field in required_strength_arrays:
                if field not in strengths:
                    structure_errors.append(f"strengths_analysis.{field} is missing")
                elif not isinstance(strengths[field], list):
                    structure_errors.append(f"strengths_analysis.{field} must be an array")
        
        # Validate weaknesses_analysis arrays
        if "weaknesses_analysis" in report:
            weaknesses = report["weaknesses_analysis"]
            required_weakness_arrays = [
                "critical_gaps_against_job_description",
                "technical_deficiencies",
                "resume_presentation_issues", 
                "soft_skills_gaps",
                "missing_essential_elements"
            ]
            for field in required_weakness_arrays:
                if field not in weaknesses:
                    structure_errors.append(f"weaknesses_analysis.{field} is missing")
                elif not isinstance(weaknesses[field], list):
                    structure_errors.append(f"weaknesses_analysis.{field} must be an array")
        
        # Validate section_wise_detailed_feedback
        if "section_wise_detailed_feedback" in report:
            feedback = report["section_wise_detailed_feedback"]
            required_feedback_sections = [
                "contact_information", "profile_summary", "education", 
                "skills", "projects", "missing_sections"
            ]
            for section in required_feedback_sections:
                if section not in feedback:
                    structure_errors.append(f"section_wise_detailed_feedback.{section} is missing")
                elif section != "missing_sections" and not isinstance(feedback[section], dict):
                    structure_errors.append(f"section_wise_detailed_feedback.{section} must be an object")
                
                # Validate section feedback structure (except missing_sections)
                if section != "missing_sections" and isinstance(feedback.get(section), dict):
                    section_obj = feedback[section]
                    required_section_fields = ["current_state", "strengths", "improvements"]
                    for field in required_section_fields:
                        if field not in section_obj:
                            structure_errors.append(f"section_wise_detailed_feedback.{section}.{field} is missing")
                        elif field == "current_state" and not isinstance(section_obj[field], str):
                            structure_errors.append(f"section_wise_detailed_feedback.{section}.{field} must be a string")
                        elif field in ["strengths", "improvements"] and not isinstance(section_obj[field], list):
                            structure_errors.append(f"section_wise_detailed_feedback.{section}.{field} must be an array")
            
            # Validate missing_sections structure
            if "missing_sections" in feedback and isinstance(feedback["missing_sections"], dict):
                missing_sections = feedback["missing_sections"]
                required_missing_fields = ["certifications", "experience", "achievements", "soft_skills"]
                for field in required_missing_fields:
                    if field not in missing_sections:
                        structure_errors.append(f"section_wise_detailed_feedback.missing_sections.{field} is missing")
                    elif not isinstance(missing_sections[field], str):
                        structure_errors.append(f"section_wise_detailed_feedback.missing_sections.{field} must be a string")
        
        return len(structure_errors) == 0, structure_errors
    
    @staticmethod
    def validate_value_ranges(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate that numeric values are within expected ranges
        """
        range_errors = []
        
        # Score should be 0-100
        if "score_out_of_100" in data:
            score = data["score_out_of_100"]
            if not (0 <= score <= 100):
                range_errors.append(f"score_out_of_100 must be between 0-100, got {score}")
        
        # Percentage should be 0-100  
        if "chance_of_selection_percentage" in data:
            percentage = data["chance_of_selection_percentage"]
            if not (0 <= percentage <= 100):
                range_errors.append(f"chance_of_selection_percentage must be between 0-100, got {percentage}")
        
        return len(range_errors) == 0, range_errors
    
    @staticmethod
    def validate_string_values(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate that string fields have valid values
        """
        value_errors = []
        
        # job_description_validity should be "Valid" or "Invalid"
        if "job_description_validity" in data:
            validity = data["job_description_validity"]
            if validity not in ["Valid", "Invalid"]:
                value_errors.append(f"job_description_validity must be 'Valid' or 'Invalid', got '{validity}'")
        
        # resume_eligibility should be specific values
        if "resume_eligibility" in data:
            eligibility = data["resume_eligibility"]
            valid_eligibility = ["Eligible", "Not Eligible", "Partially Eligible"]
            if eligibility not in valid_eligibility:
                value_errors.append(f"resume_eligibility must be one of {valid_eligibility}, got '{eligibility}'")
        
        return len(value_errors) == 0, value_errors
    
    @staticmethod
    def validate_array_contents(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate that arrays contain meaningful content
        """
        content_errors = []
        
        # Check resume_improvement_priority has meaningful items
        if "resume_improvement_priority" in data and isinstance(data["resume_improvement_priority"], list):
            priorities = data["resume_improvement_priority"]
            if len(priorities) == 0:
                content_errors.append("resume_improvement_priority cannot be empty")
            for i, priority in enumerate(priorities):
                if not isinstance(priority, str) or len(priority.strip()) < 15:
                    content_errors.append(f"resume_improvement_priority[{i}] must be a detailed explanation (min 15 chars)")
        
        return len(content_errors) == 0, content_errors
    
    @staticmethod
    def validate_with_pydantic(data: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Final validation using Pydantic model
        """
        try:
            # Try to create the Pydantic model
            response_model = ResumeAnalysisResponse(**data)
            return True, "Pydantic validation passed"
        except ValidationError as e:
            error_details = []
            for error in e.errors():
                loc = " -> ".join(str(x) for x in error['loc'])
                error_details.append(f"{loc}: {error['msg']}")
            return False, f"Pydantic validation failed: {'; '.join(error_details)}"
    
    @classmethod
    def comprehensive_validate(cls, data: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
        """
        Run comprehensive validation on AI response
        Returns: (is_valid, validation_report)
        """
        validation_report = {
            "is_valid": True,
            "errors": [],
            "warnings": [],
            "validation_steps": {}
        }
        
        logger.info("Starting comprehensive response validation")
        
        # Step 1: Check required fields
        fields_valid, missing_fields = cls.validate_required_fields(data)
        validation_report["validation_steps"]["required_fields"] = {
            "passed": fields_valid,
            "missing_fields": missing_fields
        }
        if not fields_valid:
            validation_report["errors"].extend([f"Missing required field: {field}" for field in missing_fields])
            validation_report["is_valid"] = False
        
        # Step 2: Check data types
        types_valid, type_errors = cls.validate_data_types(data)
        validation_report["validation_steps"]["data_types"] = {
            "passed": types_valid,
            "type_errors": type_errors
        }
        if not types_valid:
            validation_report["errors"].extend(type_errors)
            validation_report["is_valid"] = False
        
        # Step 3: Check nested structure
        structure_valid, structure_errors = cls.validate_nested_structure(data)
        validation_report["validation_steps"]["nested_structure"] = {
            "passed": structure_valid,
            "structure_errors": structure_errors
        }
        if not structure_valid:
            validation_report["errors"].extend(structure_errors)
            validation_report["is_valid"] = False
        
        # Step 4: Check value ranges
        ranges_valid, range_errors = cls.validate_value_ranges(data)
        validation_report["validation_steps"]["value_ranges"] = {
            "passed": ranges_valid,
            "range_errors": range_errors
        }
        if not ranges_valid:
            validation_report["errors"].extend(range_errors)
            validation_report["is_valid"] = False
        
        # Step 5: Check string values
        strings_valid, value_errors = cls.validate_string_values(data)
        validation_report["validation_steps"]["string_values"] = {
            "passed": strings_valid,
            "value_errors": value_errors
        }
        if not strings_valid:
            validation_report["errors"].extend(value_errors)
            validation_report["is_valid"] = False
        
        # Step 6: Check array contents
        arrays_valid, content_errors = cls.validate_array_contents(data)
        validation_report["validation_steps"]["array_contents"] = {
            "passed": arrays_valid,
            "content_errors": content_errors
        }
        if not arrays_valid:
            validation_report["warnings"].extend(content_errors)  # These are warnings, not hard errors
        
        # Step 7: Final Pydantic validation
        pydantic_valid, pydantic_message = cls.validate_with_pydantic(data)
        validation_report["validation_steps"]["pydantic_validation"] = {
            "passed": pydantic_valid,
            "message": pydantic_message
        }
        if not pydantic_valid:
            validation_report["errors"].append(pydantic_message)
            validation_report["is_valid"] = False
        
        # Summary
        validation_report["summary"] = {
            "total_errors": len(validation_report["errors"]),
            "total_warnings": len(validation_report["warnings"]),
            "validation_passed": validation_report["is_valid"]
        }
        
        if validation_report["is_valid"]:
            logger.info("✅ Response validation passed successfully")
        else:
            logger.error(f"❌ Response validation failed with {len(validation_report['errors'])} errors")
            for error in validation_report["errors"]:
                logger.error(f"  - {error}")
        
        return validation_report["is_valid"], validation_report 