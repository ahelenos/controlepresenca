# Controle de PresenÃ§a - V1

Sistema web de controle de presenÃ§a de colaboradores.

## Tecnologias

- HTML
- CSS
- JavaScript
- Supabase Auth
- Supabase PostgreSQL
- Supabase RLS
- GitHub Pages

## Estrutura

- index.html: login
- app.html: aplicaÃ§Ã£o principal
- js/config.js: configuraÃ§Ã£o do Supabase
- js/supabase.js: cliente Supabase
- js/auth.js: autenticaÃ§Ã£o
- js/app.js: funcionalidades
- css/app.css: interface

## ConfiguraÃ§Ã£o

O gerador solicita:

- Project URL
- Publishable Key

NÃ£o utilize a chave service_role.

## Banco

O banco precisa ter sido criado pelo SQL fornecido para o projeto.

TambÃ©m Ã© necessÃ¡rio possuir pelo menos um usuÃ¡rio no Supabase Auth
com um registro correspondente na tabela profiles.

## Primeiro administrador

Exemplo:

INSERT INTO public.profiles (
    id,
    nome,
    perfil,
    ativo
)
VALUES (
    'UUID_DO_USUARIO_AUTH',
    'Administrador',
    'admin',
    true
);

## Executar localmente

Recomendado utilizar VS Code + Live Server.

Abra:

index.html

## GitHub Pages

Envie o conteÃºdo da pasta para um repositÃ³rio GitHub e habilite:

Settings
  >
Pages
  >
Deploy from branch

Use a branch principal e a pasta raiz.

## Regras

Checkbox marcado:
presente = true

Checkbox desmarcado:
presente = false

A lista de almoÃ§o Ã© formada pelos colaboradores que possuem
presenÃ§a verdadeira no perÃ­odo da manhÃ£.

## UsuÃ¡rios

A V1 nÃ£o cria usuÃ¡rios Auth diretamente no navegador.

A criaÃ§Ã£o administrativa de usuÃ¡rios deverÃ¡ ser feita posteriormente
por uma Supabase Edge Function segura.

## RelatÃ³rios

O botÃ£o "Imprimir / Salvar PDF" utiliza a funÃ§Ã£o de impressÃ£o
do navegador.

Na janela de impressÃ£o escolha:

Salvar como PDF.

