module "spa-01" {
  source = "./_modules/spa"

  environment    = var.environment
  location       = var.location
  resourcePrefix = var.resourcePrefix
  asp_sku_name   = var.asp_sku_name

  tags = var.tags
}