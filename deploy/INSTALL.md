# Instalação Rápida - Conectenvios

## Requisitos

- Ubuntu 22.04+ ou Debian 12+
- 2GB RAM mínimo
- 20GB disco
- Domínio apontando para o servidor

## Instalação em 3 Passos

### 1. Clonar e Entrar

```bash
git clone https://github.com/fredserel/Sistema-kanban.git /opt/conectenvios
cd /opt/conectenvios/deploy
chmod +x scripts/*.sh
```

### 2. Executar Setup

```bash
./scripts/setup.sh
```

O script irá:
- Instalar Docker (se necessário)
- Gerar senhas automaticamente
- Criar containers
- Executar migrations
- Criar usuários padrão

### 3. Configurar SSL

```bash
./scripts/init-ssl.sh
```

## Pronto!

Acesse: **https://kanban.conectenvios.com.br**

### Usuários Padrão

| Email | Senha | Perfil |
|-------|-------|--------|
| admin@sistema.com | admin123 | Super Admin |
| gerente@sistema.com | gerente123 | Gerente |
| membro@sistema.com | membro123 | Operador |

**IMPORTANTE:** Altere as senhas após o primeiro login!

---

## Comandos Úteis

```bash
# Ver status
docker compose -f docker-compose.prod.yml ps

# Ver logs
docker compose -f docker-compose.prod.yml logs -f

# Backup
./scripts/backup.sh

# Atualizar
git pull && ./scripts/setup.sh --update
```

## Suporte

Documentação completa: [README.md](README.md)
