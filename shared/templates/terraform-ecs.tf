# Terraform ECS 实例模板
# 用于快速创建阿里云 ECS 实例

variable "instance_name" {
  description = "ECS 实例名称"
  type        = string
}

variable "instance_type" {
  description = "实例规格"
  type        = string
  default     = "ecs.c6.large"
}

variable "image_id" {
  description = "镜像 ID"
  type        = string
  default     = "ubuntu_22_04_x64_20G_alibase_20231222.vhd"
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "vswitch_id" {
  description = "交换机 ID"
  type        = string
}

variable "security_group_ids" {
  description = "安全组 ID 列表"
  type        = list(string)
}

variable "system_disk_size" {
  description = "系统盘大小 (GB)"
  type        = number
  default     = 40
}

variable "tags" {
  description = "实例标签"
  type        = map(string)
  default     = {}
}

resource "alicloud_instance" "main" {
  instance_name        = var.instance_name
  instance_type        = var.instance_type
  image_id             = var.image_id
  vswitch_id           = var.vswitch_id
  security_groups      = var.security_group_ids
  system_disk_size     = var.system_disk_size
  internet_charge_type = "PayByTraffic"
  internet_max_bandwidth_out = 10
  
  tags = merge({
    Name        = var.instance_name
    Environment = "production"
    ManagedBy   = "terraform"
  }, var.tags)
  
  user_data = <<-EOF
              #!/bin/bash
              # 初始化脚本
              apt-get update
              apt-get install -y docker.io
              systemctl enable docker
              systemctl start docker
              EOF
}

output "instance_id" {
  value = alicloud_instance.main.id
}

output "public_ip" {
  value = alicloud_instance.main.public_ip
}

output "private_ip" {
  value = alicloud_instance.main.private_ip
}
