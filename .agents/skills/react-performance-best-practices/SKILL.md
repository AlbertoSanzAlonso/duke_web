---
name: react-performance-best-practices
description: Directivas críticas para optimizar el rendimiento de aplicaciones React de gran escala (como Duke Burger). Evita re-renderizados innecesarios y mejora la responsividad de la UI.
---

# React Performance Best Practices (Duke Burger Standard)

Este skill define cómo optimizar componentes React complejos para asegurar una experiencia fluida, especialmente en dispositivos móviles y dashboards de alta frecuencia.

## 1. Localización del Estado (State Colocation)
*   **Regla**: Mantén el estado lo más cerca posible de donde se usa.
*   **Acción**: Si una variable de estado (como un `timer` o `clock`) cambia frecuentemente, extráela a un componente hijo dedicado para que solo se re-renderice ese pequeño fragmento.
*   **Anti-patrón**: Tener un `currentTime` en el nivel raíz de un componente de 1000+ líneas.

## 2. Memoización Inteligente
*   **useMemo**: Utilízalo para cálculos financieros, filtrado de listas grandes y mapeo de categorías.
    ```javascript
    const filteredData = useMemo(() => data.filter(...), [data, searchTerm]);
    ```
*   **useCallback**: Envuelve handlers de eventos que se pasan a componentes hijos pesados para mantener estabilidad de referencia.
*   **React.memo**: Envuelve sub-componentes puros que reciben props complejas.

## 3. Fluidez con Transitions
*   **useTransition**: Usa esta hook para actualizaciones de estado no urgentes (como el filtrado de una tabla al escribir en un buscador).
    ```javascript
    onChange={(e) => startTransition(() => setSearchTerm(e.target.value))}
    ```

## 4. Virtualización y Paginación
*   **Paginación**: Limitar los listados administrativos a **10 elementos por página** estrictamente en entornos móviles.
*   **Lazy Loading**: Cargar rutas pesadas con `React.lazy` y `Suspense`.

## 5. Refs para DOM Directo
*   Usa `useRef` para valores que no necesitan disparar un re-renderizado (como IDs de timers o referencias a elementos DOM para animaciones).
