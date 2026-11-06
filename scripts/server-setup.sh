#!/usr/bin/env bash
# Prepara uma VM Ubuntu 24.04 da Oracle Cloud para o Habits (spec 008). Rode UMA vez, como root:
#   sudo bash server-setup.sh "<chave pública SSH do GitHub Actions>"
# Passo a passo completo em docs/deploy.md.
set -euo pipefail

ci_public_key="${1:?informe a chave pública SSH do deploy (GitHub Actions) como argumento}"
repo_url="${HABITS_REPO_URL:-https://github.com/AlexcrGomes/habitsapp.git}"
app_dir=/opt/habitsapp

echo "==> Atualizações e pacotes básicos"
apt-get update -q
DEBIAN_FRONTEND=noninteractive apt-get upgrade -yq
DEBIAN_FRONTEND=noninteractive apt-get install -yq ca-certificates curl git unattended-upgrades iptables-persistent
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "==> Docker Engine + Compose (repositório oficial)"
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update -q
DEBIAN_FRONTEND=noninteractive apt-get install -yq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker

echo "==> Firewall: a imagem Ubuntu da Oracle bloqueia 80/443 no iptables"
for port in 80 443; do
  iptables -C INPUT -p tcp --dport "$port" -m state --state NEW -j ACCEPT 2>/dev/null \
    || iptables -I INPUT 6 -p tcp --dport "$port" -m state --state NEW -j ACCEPT
done
netfilter-persistent save

echo "==> SSH só por chave"
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl reload ssh

echo "==> Swap de 2 GB"
if [[ ! -f /swapfile ]]; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Usuário deploy (usado pelo GitHub Actions)"
id deploy &>/dev/null || adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
echo "$ci_public_key" > /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys

echo "==> Código em $app_dir"
if [[ ! -d "$app_dir/.git" ]]; then
  git clone "$repo_url" "$app_dir"
fi
chown -R deploy:deploy "$app_dir"

echo
echo "Pronto. Próximo passo: criar $app_dir/.env (veja docs/deploy.md) e rodar, como deploy:"
echo "  sudo -u deploy $app_dir/scripts/deploy.sh"
