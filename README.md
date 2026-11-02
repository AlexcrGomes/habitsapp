<h1 align="center"> Tracking habits </h1>

<p align="center">
Utilizando tecnologias WEB está aplicação permite o rastreamento de hábitos. <br/>
</p>

<p align="center">
  <a href="#-tecnologias">Tecnologias</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-projeto">Projeto</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#-layout">Layout</a>&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;
</p>

<br>

<p align="center">
  <img alt="projeto Habits" src="preview.png" width="100%">
</p>

## 🚀 Tecnologias

Esse projeto foi desenvolvido com as seguintes tecnologias:

- React + TypeScript (Vite) e Nginx
- Java 21 + Spring Boot
- PostgreSQL
- Docker Compose
- Figma

## 💻 Projeto

O Habits é um app para ajudar a rastrear os hábitos. Cada pessoa cria sua conta e vê só os
próprios hábitos e registros, guardados no servidor.

> A versão original, só com HTML/CSS/JS e dados no navegador, nasceu do NLW Setup
> ([projeto de referência](https://maykbrito.github.io/nlw-setup)).

## ▶️ Como rodar

Pré-requisito: Docker com Compose (no Windows, dentro do WSL).

```bash
cp .env.example .env        # troque a senha do banco
docker compose up --build   # http://localhost:8080
```

Testes:

```bash
scripts/api-mvn.sh verify   # API (sobe um PostgreSQL de teste com Testcontainers)
cd web && npm install && npm test
```

## 🔖 Layout

Você pode visualizar o layout do projeto através [DESSE LINK](https://www.figma.com/community/file/1195327109778210238). É necessário ter conta no [Figma](https://figma.com) para acessá-lo.

## 🧭 Desenvolvimento (Spec Driven)

Este projeto segue **Spec Driven Development** no formato do GitHub Spec Kit: toda feature começa por uma especificação aprovada.

- [Guia do processo](docs/sdd-guia.md)
- [Constituição do projeto](.specify/memory/constitution.md)
- [Especificações das features](specs/)


---