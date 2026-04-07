---
name: ai-assistant-context
description: Gestión y mantenimiento del conocimiento de Duke Assist
---

# Duke Assist - Gestión de Conocimiento

Este skill define cómo mantener actualizado el sistema de ayuda inteligente del panel.

## Responsabilidades de los Agentes
1. **Actualización del Manual:** Cada vez que se implemente una lógica nueva o se cambie una regla de negocio (ej: cambios en el redondeo de precios, nuevos estados de pedidos), se DEBE actualizar el archivo `docs/manual_admin.md`.
2. **Contexto de Inyección:** El asistente utiliza un RAG dinámico basado en archivos. No requiere base de datos vectorial, por lo que la "ingesta" es simplemente la edición del archivo Markdown.
3. **Mantenimiento Técnico:**
   - Proveedor: Groq API.
   - Modelo: llama-3.3-70b-versatile.
   - Endpoint: `/api/ai-help/`.

## Recomendaciones de Estilo para el Manual
- Usar un tono directo y profesional.
- Incluir ejemplos de cómo preguntar a la IA.
- Mantener el manual por debajo de los 10k tokens para asegurar respuestas rápidas.
