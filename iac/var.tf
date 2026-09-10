variable "location" {
  description = "The location where the resource group will be created."
  type        = string
}

variable "environment" {
  description = "The environment for the resources."
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "The environment must be one of 'dev' or 'prod'."
  }
}

variable "resourcePrefix" {
  description = "This string will be used for all resource namings. <pre>-rg, <pre>-asp, <pre>-app"
  type = string
}

variable "asp_sku_name" {
  description = "App service plan SKU name. B1-3, S1-10, P*, Y1, F1"
  type = string
  default = "B1"
}

variable "tags" {
  description = "A map of tags to assign to the resources."
  type        = map(string)
  default     = {}
}

variable "subscription_id" {
  description = "Subscription Id to set azure context"
  type = string
}