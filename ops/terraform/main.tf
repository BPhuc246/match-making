# Create resource group ( resource name group + region )
resource "azurerm_resource_group" "rg" {
  name     = "${random_pet.prefix.id}-rg"
  location = var.resource_group_location
}

# Create virtual network
/*
    Basic:
        Resource group
        Virtual machine name
        Region
    
    Security: ( it is not free ) -> skip

    Address space:
        The amount of address = 2^(32 - N) -> 2^(32-16) = 2^16 = 65 536
    
    10.0.0.0 - 10.255.255.255 (Class A — huge pool, most popular in cloud)
    172.16.0.0 - 172.31.255.255 (Class B — common in local office networks)
    192.168.0.0 - 192.168.255.255 (Class C — standard for home Wi-Fi routers)

    Tags: support view dashboard ( may skip )
    Review + create: auto
*/
resource "azurerm_virtual_network" "my_terraform_network" {
  name                = "${random_pet.prefix.id}-vnet"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  address_space       = ["10.0.0.0/16"]
}

# Create subnet
/*
In subnets section from settings of virtual network created
--> need virutal_network_name: <your virtual network name>
--> add into resource group
name: default ( compulse )
IPv4:
    Include an IPv4 address space: Checked
    IPv4 address range:
    Starting address ( compulse ):
    Size:
    Subnet address range:

--> Create a specific ip address ( subet ip address ) to connect from the main ip address
*/
resource "azurerm_subnet" "my_terraform_subnet" {
  name                 = "${random_pet.prefix.id}-subnet"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.my_terraform_network.name
  address_prefixes     = ["10.0.1.0/24"]
}

# Create public IPs: a public IP if you want to access it from the internet
/*
Basic:
  Resource name:
  region:
  name:

  SKUL
  IP address assignment:

*/
resource "azurerm_public_ip" "my_terraform_public_ip" {
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  name                = "${random_pet.prefix.id}-public-ip"

  sku               = "Standard"
  allocation_method = "Static" # public IP should remain stable rather than changing
}

# Create Network Security Group and rules: An NSG is basically a network firewall.
/*

*/
resource "azurerm_network_security_group" "my_terraform_nsg" {
  name                = "${random_pet.prefix.id}-nsg"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  security_rule {
    name                       = "SSH"
    priority                   = 1000
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
  security_rule {
    name                       = "web"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
  security_rule {
    name                       = "AllowCertBot"
    priority                   = 1021
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
  security_rule {
    name                       = "AllowGrafana"
    priority                   = 1031
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "3000"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
  security_rule {
    name                       = "AllowPrometheus"
    priority                   = 1041
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "9090"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

# Create network interface: connects your VM to the Azure network
/*
name:
region

*/
resource "azurerm_network_interface" "my_terraform_nic" {
  name                = "${random_pet.prefix.id}-nic"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  ip_configuration {
    name                          = "my_nic_configuration"
    subnet_id                     = azurerm_subnet.my_terraform_subnet.id # plugs the NIC into private subnet
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.my_terraform_public_ip.id # attaches a Public IP Address
  }
}

# Connect the security group to the network interface
resource "azurerm_network_interface_security_group_association" "example" { # attaches the Firewall
  network_interface_id      = azurerm_network_interface.my_terraform_nic.id
  network_security_group_id = azurerm_network_security_group.my_terraform_nsg.id
}

# Create virtual machine
resource "azurerm_linux_virtual_machine" "main" { # create a virtual machine with authentication is ssh key
  name                            = "${var.prefix}-vm"
  admin_username                  = var.admin_username
  location              = azurerm_resource_group.rg.location
  resource_group_name   = azurerm_resource_group.rg.name
  disable_password_authentication = true # Disable Password Authentication

  admin_ssh_key {
    username   = var.admin_username
    public_key = file("~/.ssh/matchmaking.pub")
  }

  network_interface_ids = [azurerm_network_interface.my_terraform_nic.id]
  size                  = "Standard_B2ls_v2"

  os_disk {
    name                 = "${random_pet.prefix.id}-osdisk"
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "ubuntu-24_04-lts"
    sku       = "server"
    version   = "latest"
  }
}

resource "random_pet" "prefix" {
  prefix = var.prefix
  length = 1
}