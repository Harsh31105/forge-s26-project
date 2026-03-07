output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.trace_evaluations.bucket
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.trace_evaluations.arn
}

output "bucket_region" {
  description = "Region of the S3 bucket"
  value       = var.aws_region
}
