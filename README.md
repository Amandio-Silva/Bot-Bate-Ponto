# ⏰ Sistema de Bate Ponto para Discord

![Discord.js](https://img.shields.io/badge/Discord.js-v14-blue?style=for-the-badge&logo=discord&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-v18+-green?style=for-the-badge&logo=node.js&logoColor=white)
![Status](https://img.shields.io/badge/Status-Ativo-success?style=for-the-badge)

> 💼 Sistema de gestão de staff totalmente automatizado para Discord.  
> Controla **início**, **pausa** e **fim** de turnos, regista o total de horas e mostra **relatórios e rankings** diretamente no chat.

---

## 🚀 Funcionalidades

### 🎛️ Painel interativo de botões
- **🟢 Iniciar** — Começa um novo turno  
- **⏸️ Pausar / Retomar** — Faz pausas com tempo contabilizado  
- **🔴 Finalizar** — Encerra o turno e adiciona ao histórico

### 📊 Relatórios detalhados
- Comando `!horas @utilizador` (admin)
  - Mostra total de horas, sessões e pausas
  - Exibe as 5 sessões mais recentes  
  - Formatação visual com **embeds**

### 🏆 Ranking de horas
- Comando `!ranking` (admin)
  - Lista o **Top 10** membros mais dedicados
  - Mostra tempo total acumulado

### 💾 Armazenamento local
- Todos os dados são guardados em `bateponto.json` (ficheiro JSON)
- Persistente mesmo após reiniciar o bot

### 🎮 Status personalizado
- O bot entra com status:  
  `🔴 Não incomodar | 🎮 A jogar no 4URP`

---

## 🧠 Requisitos

| Dependência | Versão Requerida |
|--------------|------------------|
| Node.js | 18 ou superior |
| discord.js | v14 |
| fs, path | Nativos no Node.js |

---

## ⚙️ Instalação

1. **Clonar o repositório**
   ```bash
   git clone https://github.com/teu-usuario/ironman-bot.git
   cd ironman-bot
