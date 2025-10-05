import streamlit as st
import time
import random
from PIL import Image

# --- Configuración de la página ---
# Usamos un layout ancho y un título para la pestaña del navegador.
st.set_page_config(
    page_title="MediScan AI",
    page_icon="🩺",
    layout="wide"
)

# --- Simulación de Datos de Diagnóstico ---
# Estos son los mismos resultados que tenías en tu código de React.
DIAGNOSIS_CONDITIONS = [
    {
      "condition": "COVID-19 Detectado",
      "confidence": 87,
      "details": "Se observan opacidades en vidrio esmerilado bilaterales características de neumonía por COVID-19.",
      "is_normal": False,
    },
    {
      "condition": "Tuberculosis Detectada",
      "confidence": 92,
      "details": "Presencia de infiltrados en lóbulos superiores y cavitaciones compatibles con tuberculosis pulmonar activa.",
      "is_normal": False,
    },
    {
      "condition": "Normal",
      "confidence": 95,
      "details": "No se detectan anomalías significativas. Los campos pulmonares están claros y bien aireados.",
      "is_normal": True,
    },
]


# --- Funciones de la Aplicación ---

def do_login(username, password):
    """Función de login simulada."""
    # En una app real, aquí validarías contra una base de datos.
    if username and password:
        st.session_state.is_authenticated = True
        st.rerun() # Vuelve a ejecutar el script para mostrar el dashboard
    else:
        st.error("Por favor, introduce un correo y contraseña.")

def do_logout():
    """Función para cerrar sesión."""
    st.session_state.is_authenticated = False
    st.rerun()

def reset_analysis():
    """Resetea el estado para analizar una nueva imagen."""
    st.session_state.uploaded_image = None
    st.session_state.diagnosis = None
    st.rerun()

def simulate_analysis():
    """Simula el proceso de análisis de la IA."""
    # Muestra un spinner mientras "procesa"
    with st.spinner("Analizando imagen... Nuestro sistema de IA está procesando la radiografía."):
        time.sleep(3) # Simula el tiempo de espera
        # Elige un resultado al azar
        st.session_state.diagnosis = random.choice(DIAGNOSIS_CONDITIONS)
    st.rerun()

# --- Inicialización del Estado de la Sesión ---
# st.session_state es un diccionario que persiste mientras el usuario interactúa con la app.
if "is_authenticated" not in st.session_state:
    st.session_state.is_authenticated = False
if "uploaded_image" not in st.session_state:
    st.session_state.uploaded_image = None
if "diagnosis" not in st.session_state:
    st.session_state.diagnosis = None


# --- Renderizado de la Interfaz ---

# 1. PANTALLA DE LOGIN
# Si el usuario no está autenticado, muestra el formulario de login.
if not st.session_state.is_authenticated:
    st.image("https://i.imgur.com/3g2z9QJ.png", width=80) # Un logo simple
    st.title("Bienvenido a MediScan AI")
    st.write("Sistema de diagnóstico médico por imagen.")
    
    with st.form("login_form"):
        email = st.text_input("Correo electrónico", placeholder="doctor@hospital.com")
        password = st.text_input("Contraseña", type="password", placeholder="••••••••")
        submitted = st.form_submit_button("Iniciar sesión")

        if submitted:
            do_login(email, password)

# 2. PANTALLA PRINCIPAL (DASHBOARD)
# Si el usuario está autenticado, muestra el dashboard.
else:
    # --- Header ---
    header = st.container()
    with header:
        col1, col2 = st.columns([4, 1])
        with col1:
            st.title("🩺 MediScan AI")
            st.markdown("#### Análisis de Imágenes Médicas")
        with col2:
            st.button("Cerrar sesión", on_click=do_logout, use_container_width=True)
    st.divider()

    # --- Contenido Principal ---
    # Centramos el contenido para una mejor apariencia
    _, main_col, _ = st.columns([1, 4, 1])
    with main_col:
        # A. MOSTRAR RESULTADOS
        if st.session_state.diagnosis:
            diag = st.session_state.diagnosis
            
            # Alerta con el resultado principal
            if diag["is_normal"]:
                st.success(f"**{diag['condition']}** (Confianza: {diag['confidence']}%)", icon="✅")
            else:
                st.warning(f"**{diag['condition']}** (Confianza: {diag['confidence']}%)", icon="⚠️")
            
            st.write(diag["details"])
            
            # Layout de dos columnas para imagen y detalles
            col1, col2 = st.columns(2)
            with col1:
                st.image(st.session_state.uploaded_image, caption="Imagen Analizada", use_column_width=True)
            
            with col2:
                with st.container(border=True):
                    st.subheader("Detalles del Análisis")
                    # Barra de progreso para la confianza
                    st.write("Nivel de Confianza:")
                    st.progress(diag['confidence'], text=f"{diag['confidence']}%")
                    
                    st.subheader("Recomendaciones")
                    if diag["is_normal"]:
                        st.markdown("""
                        - Mantener controles periódicos de rutina.
                        - Continuar con hábitos saludables.
                        """)
                    else:
                        st.markdown("""
                        - **Consultar con un especialista inmediatamente.**
                        - Realizar pruebas complementarias según indicación médica.
                        - Seguir protocolo de aislamiento si es necesario.
                        """)
            
            # Disclaimer y botón para resetear
            st.info("Este análisis es generado por IA y debe ser validado por un profesional médico.", icon="ℹ️")
            st.button("Analizar otra imagen", on_click=reset_analysis, use_container_width=True)

        # B. MOSTRAR VISTA PREVIA Y BOTÓN DE ANÁLISIS
        elif st.session_state.uploaded_image:
            st.subheader("Imagen Cargada")
            st.image(st.session_state.uploaded_image, caption="Radiografía de Tórax Cargada", use_column_width=True)

            col1, col2 = st.columns(2)
            with col1:
                st.button("Analizar Imagen", on_click=simulate_analysis, type="primary", use_container_width=True)
            with col2:
                st.button("Cancelar", on_click=reset_analysis, use_container_width=True)

        # C. MOSTRAR EL UPLOADER DE IMÁGENES (ESTADO INICIAL)
        else:
            with st.container(border=True):
                st.subheader("Sube una radiografía de tórax")
                st.write("Arrastra y suelta una imagen aquí, o haz clic para seleccionar un archivo.")
                uploaded_file = st.file_uploader(
                    "Seleccionar imagen",
                    type=["png", "jpg", "jpeg"],
                    label_visibility="collapsed"
                )
                if uploaded_file is not None:
                    # Guardamos la imagen en el estado de la sesión y volvemos a ejecutar
                    # para mostrar la vista previa.
                    st.session_state.uploaded_image = Image.open(uploaded_file)
                    st.rerun()