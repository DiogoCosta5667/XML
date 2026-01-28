# Hotel Reservation System - XML & XQuery

<p align="center">
  <a href="#english">English</a>
  &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#portuguese">Português</a>
</p>

---

<div id="english">

## About

A complete hotel reservation management system built with XML data structuring, XQuery for queries, and BaseX as the native XML database. The project includes a modern web interface for managing reservations, guests, and additional services.

## Features

- XML-based data structure with XSD schema validation
- XQuery queries for data manipulation and reporting
- BaseX native XML database integration
- RESTful API with CORS support
- Modern responsive web interface
- Real-time reservation management
- Guest information tracking
- Additional services management (Spa, Restaurant, Transport)
- MongoDB integration for analytics
- API documentation with Swagger

## Technologies

### Data Layer
- **XML** - Data structuring
- **XSD Schema** - Data validation
- **XQuery** - Query language
- **BaseX** - Native XML database
- **MongoDB** - Analytics and reporting

### Backend
- **BaseX RESTXQ** - RESTful API
- **api_hotel.xqm** - XQuery module for API endpoints

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with modern design
- **JavaScript** - Interactive features
- **Vanilla JS** - No framework dependencies

### Additional
- **Swagger** - API documentation
- **JSON** - Data exchange format

## Project Structure

```
XML/
├── reservas.xml              # Reservations data
├── reservas.xsd              # XML Schema validation
├── reservas.json             # JSON export
├── api_hotel.xqm             # XQuery API module
├── query1_reservas_hospede.xq    # Guest reservations query
├── query2_reservas_por_unidade.xq # Unit reservations query
├── query3_total_servicos.xq      # Services total query
├── consultas_mongodb.js      # MongoDB queries
├── website/
│   ├── backend/              # BaseX configuration
│   └── frontend/             # Web interface
│       ├── index.html        # Main interface
│       ├── app.js            # Application logic
│       ├── update-form.js    # Update functionality
│       ├── styles.css        # Styling
│       └── swagger.html      # API documentation
├── Relatorio-8240558_8240544.pdf   # Project report
└── LICENSE
```

## Data Model

### Reservation Schema
- Guest information (Client ID, Name, NIF, Email, Phone)
- Accommodation unit (LS, PO, CB, FR, BR)
- Check-in and check-out dates
- Total value
- Additional services (max 4 per reservation)

### Validations
- Client number: 3 letters + 3 digits (e.g., ABC123)
- NIF: 9 digits
- Phone: 9 digits starting with 9
- Email: Standard email format
- Reservation number: R + 3 digits (e.g., R001)

## XQuery Queries

### Query 1: Guest Reservations
Retrieves all reservations for a specific guest

### Query 2: Reservations by Unit
Lists reservations grouped by accommodation unit

### Query 3: Total Services
Calculates total revenue from additional services

## Installation

### Prerequisites
- BaseX 9.0 or higher
- Modern web browser
- Optional: MongoDB for analytics

### Setup

1. Clone the repository
```bash
git clone https://github.com/ArpaoCeleste/xml.git
cd xml
```

2. Start BaseX server
```bash
basexserver
```

3. Import data to BaseX
```bash
basex
CREATE DB reservas reservas.xml
```

4. Deploy API module
Copy `api_hotel.xqm` to BaseX webapp directory

5. Open web interface
Navigate to `website/frontend/index.html` in your browser

## API Endpoints

### GET /reservas
List all reservations

### GET /reservas/{id}
Get specific reservation by ID

### POST /reservas
Create new reservation

### PUT /reservas/{id}
Update existing reservation

### DELETE /reservas/{id}
Delete reservation

Full API documentation available at `swagger.html`

## Usage

### Web Interface
1. Access `index.html`
2. View current reservations
3. Add new reservations using the form
4. Update or delete existing reservations
5. Filter by unit or guest

### XQuery Console
Execute queries directly in BaseX GUI or command line

## MongoDB Integration

The system includes MongoDB queries for:
- Reservation analytics
- Revenue reporting
- Guest statistics
- Service utilization

## Live Demo

Website: [xml-eight.vercel.app](https://xml-eight.vercel.app/)

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Authors

- Student IDs: 8240558, 8240544
- ArpaoCeleste

</div>

---

<div id="portuguese">

## Sobre

Um sistema completo de gestão de reservas hoteleiras construído com estruturação de dados XML, XQuery para consultas e BaseX como base de dados nativa XML. O projeto inclui uma interface web moderna para gerir reservas, hóspedes e serviços adicionais.

## Funcionalidades

- Estrutura de dados baseada em XML com validação de esquema XSD
- Consultas XQuery para manipulação e relatórios de dados
- Integração com base de dados nativa XML BaseX
- API RESTful com suporte CORS
- Interface web moderna e responsiva
- Gestão de reservas em tempo real
- Rastreamento de informações de hóspedes
- Gestão de serviços adicionais (Spa, Restaurante, Transporte)
- Integração com MongoDB para análise
- Documentação da API com Swagger

## Tecnologias

### Camada de Dados
- **XML** - Estruturação de dados
- **XSD Schema** - Validação de dados
- **XQuery** - Linguagem de consulta
- **BaseX** - Base de dados nativa XML
- **MongoDB** - Análise e relatórios

### Backend
- **BaseX RESTXQ** - API RESTful
- **api_hotel.xqm** - Módulo XQuery para endpoints da API

### Frontend
- **HTML5** - Estrutura
- **CSS3** - Estilização com design moderno
- **JavaScript** - Funcionalidades interativas
- **Vanilla JS** - Sem dependências de frameworks

### Adicional
- **Swagger** - Documentação da API
- **JSON** - Formato de troca de dados

## Estrutura do Projeto

```
XML/
├── reservas.xml              # Dados das reservas
├── reservas.xsd              # Validação do esquema XML
├── reservas.json             # Exportação JSON
├── api_hotel.xqm             # Módulo API XQuery
├── query1_reservas_hospede.xq    # Consulta reservas por hóspede
├── query2_reservas_por_unidade.xq # Consulta reservas por unidade
├── query3_total_servicos.xq      # Cálculo total de serviços
├── consultas_mongodb.js      # Consultas MongoDB
├── website/
│   ├── backend/              # Configuração BaseX
│   └── frontend/             # Interface web
│       ├── index.html        # Interface principal
│       ├── app.js            # Lógica da aplicação
│       ├── update-form.js    # Funcionalidade de atualização
│       ├── styles.css        # Estilos
│       └── swagger.html      # Documentação da API
├── Relatorio-8240558_8240544.pdf   # Relatório do projeto
└── LICENSE
```

## Modelo de Dados

### Esquema de Reserva
- Informações do hóspede (ID Cliente, Nome, NIF, Email, Telefone)
- Unidade de alojamento (LS, PO, CB, FR, BR)
- Datas de check-in e check-out
- Valor total
- Serviços adicionais (máximo 4 por reserva)

### Validações
- Número de cliente: 3 letras + 3 dígitos (ex: ABC123)
- NIF: 9 dígitos
- Telefone: 9 dígitos começando por 9
- Email: Formato de email padrão
- Número de reserva: R + 3 dígitos (ex: R001)

## Consultas XQuery

### Consulta 1: Reservas por Hóspede
Obtém todas as reservas de um hóspede específico

### Consulta 2: Reservas por Unidade
Lista reservas agrupadas por unidade de alojamento

### Consulta 3: Total de Serviços
Calcula a receita total dos serviços adicionais

## Instalação

### Pré-requisitos
- BaseX 9.0 ou superior
- Navegador web moderno
- Opcional: MongoDB para análise

### Configuração

1. Clonar o repositório
```bash
git clone https://github.com/ArpaoCeleste/xml.git
cd xml
```

2. Iniciar servidor BaseX
```bash
basexserver
```

3. Importar dados para BaseX
```bash
basex
CREATE DB reservas reservas.xml
```

4. Fazer deploy do módulo API
Copiar `api_hotel.xqm` para o diretório webapp do BaseX

5. Abrir interface web
Navegar para `website/frontend/index.html` no navegador

## Endpoints da API

### GET /reservas
Listar todas as reservas

### GET /reservas/{id}
Obter reserva específica por ID

### POST /reservas
Criar nova reserva

### PUT /reservas/{id}
Atualizar reserva existente

### DELETE /reservas/{id}
Eliminar reserva

Documentação completa da API disponível em `swagger.html`

## Utilização

### Interface Web
1. Aceder a `index.html`
2. Visualizar reservas atuais
3. Adicionar novas reservas usando o formulário
4. Atualizar ou eliminar reservas existentes
5. Filtrar por unidade ou hóspede

### Consola XQuery
Executar consultas diretamente no GUI do BaseX ou linha de comandos

## Integração MongoDB

O sistema inclui consultas MongoDB para:
- Análise de reservas
- Relatórios de receita
- Estatísticas de hóspedes
- Utilização de serviços

## Demo ao Vivo

Website: [xml-eight.vercel.app](https://xml-eight.vercel.app/)

## Licença

Este projeto está licenciado sob a Licença MIT - consultar ficheiro LICENSE para detalhes.

## Autores

- IDs de Estudante: 8240558, 8240544
- ArpaoCeleste

</div>
