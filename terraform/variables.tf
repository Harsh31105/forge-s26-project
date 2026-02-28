variable "aws_region" {
  description = "AWS region for the S3 bucket"
  type        = string
  default     = "us-east-2"
}

variable "bucket_name" {
  description = "Name of the S3 bucket for TRACE evaluation PDFs"
  type        = string
  default     = "forge-s26-trace-evaluations"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "development"
}
