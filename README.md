<a id="readme-top"></a>

<!-- PROJECT LOGO -->
<br />
<div align="center">

  <img src="logo-64x64.png" alt="Logo" width="64" height="64">

  <h3 align="center">Simulador APV</h3>

  <p align="center">
    Aplicación web de beneficio tributario y rentabilidad
    <br />
  </p>
</div>

<!-- ABOUT THE PROJECT -->
## Sobre el proyecto

Este proyecto es un simulador web pensado para facilitar el trabajo de una ejecutiva de una empresa financiera que contacta potenciales clientes para ofrecer planes de Ahorro Previsional Voluntario. Esta plataforma centraliza las tareas que anteriormente la ejecutiva realizaba en distintas fuentes, por lo que se espera reducir el tiempo que le toma reunir y enviar la información necesaria a los clientes.

La aplicación permite:
* Simular beneficios tributarios del APV en base a renta y aporte del cliente.
* Comparar regímenes A y B, y recomendar el de mayor beneficio.
* Calcular la rentabilidad del aporte del cliente en un período determinado.
* Realizar múltiples simulaciones en una misma sesión.
* Descargar un PDF unificado con todas las simulaciones + información adicional del APV.
* Consultar UF, UTM, dólar, y tabla de impuesto único actualizada automáticamente.
* Convertir entre CLP y UF/UTM/dólar de manera rápida.

<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>

### Tecnologías usadas
Las principales tecnologías usadas en el proyecto son:
* ![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
* ![CSS](https://img.shields.io/badge/css-%23663399.svg?style=for-the-badge&logo=css&logoColor=white)
* ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
* ![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
* ![Django](https://img.shields.io/badge/django-%23092E20.svg?style=for-the-badge&logo=django&logoColor=white)
* ![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)

Además, se utiliza Playwright+Chromium para la generación de los PDF.

### Indicadores diarios / Scraping
Cada vez que se corre el servidor se revisa si los indicadores y la tabla de impuestos están al día. En caso contrario se actualizan de la siguiente manera:
* Para los indicadores se visita la API de [mindicador.cl](https://mindicador.cl/).
* Para la tabla de impuesto único se hace web scraping de la página del [SII](https://www.sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto2025.htm).

Esto permite realizar los cálculos de las simulaciones con datos actualizados.
<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>

<!-- GETTING STARTED -->
## Instalación y ejecución

Para instalar el proyecto primero se debe descargar el repositorio como zip o clonarlo con:
```sh
   git clone https://github.com/paulh789/Simulador_APV.git
```
Luego, el archivo `start_app.py` automatiza el resto de la instalación y la ejecución del proyecto. Este script:
1. Crea el entorno virtual
2. Instala dependencias
3. Crea y ejecuta las migraciones
4. Carga datos iniciales
5. Actualiza los indicadores diarios
6. Abre el navegador y corre el servidor Django

Para correrlo:
```sh
   python start_app.py
```
En Windows, alternativamente se puede hacer doble click en el archivo `start_app.bat`.

Además, como Playwright y Chroimum son pesados, está también el archivo `start_app_no_pdf.py` que salta su instalación, lo que permite usar la aplicación pero sin la funcionalidad de generación de PDFs:
```sh
   python start_app_no_pdf.py
```

<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>

## Autor
**Paul Holmer**

Proyecto personal para facilitar el trabajo operativo de ejecutiva bancaria y poner a prueba mis habilidades técnicas construyendo un software real.

<p align="right">(<a href="#readme-top">volver al inicio</a>)</p>
