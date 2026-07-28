
create key: `ssh-keygen -t ed25519 -f matchmaking`
init: `terraform init`
validate: `terraform validate` -> sucessfully -> go to next step
plan: `terraform plan -out=tfplan` -> output is tfplan file
start: `terraform plan tfplan` -> Done

*Remember do not commit key to github, exception for public key if you are doing with team (.pub)*