variable "resource_group_location" {
  default     = "japaneast"
  description = "Location of the resource group."
}

variable "prefix" {
  type        = string
  default     = "match-making-project"
  description = "Prefix of the resource name"
}

variable "admin_username" {
  type      = string
  default   = "phucadmin"
}
