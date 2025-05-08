/**
 * @fileoverview Temporary fix for React DevTools integration issues.
 * Provides functions to disable DevTools hooks that might cause errors.
 */

/**
 * Attempts to disable the React DevTools global hook aggressively.
 * This is a workaround for potential errors caused by DevTools integration,
 * particularly the "Element type is invalid" error related to `withDevTools`.
 * Tries to delete the hook property from the global object.
 */
export const disableReactDevTools = () => {
  console.log('[DevToolsFix] Attempting to aggressively disable React DevTools hook...'); // Logging: High-level flow

  // Use globalThis for broader compatibility (including React Native environments)
  const globalObj = typeof globalThis !== 'undefined' ? globalThis : undefined;

  if (globalObj) {
    try { // Error Handling: Wrap potentially risky operation
      // Check if the hook exists before attempting deletion
      if ((globalObj as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        delete (globalObj as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
        console.info('[DevToolsFix] __REACT_DEVTOOLS_GLOBAL_HOOK__ deleted from global scope.'); // Logging: Significant event
      } else {
        console.log('[DevToolsFix] __REACT_DEVTOOLS_GLOBAL_HOOK__ not found on global scope.'); // Logging: High-level flow
      }
    } catch (error) {
      console.error('[DevToolsFix] Error occurred while trying to delete DevTools hook:', error); // Logging: Error
    }
  } else {
    console.log('[DevToolsFix] Global object (globalThis) unavailable.'); // Logging: High-level flow
  }
};

/**
 * A dummy Higher-Order Component (HOC) that does nothing.
 * It can be used as a placeholder if a component expects a HOC like `withDevTools`
 * but the actual DevTools integration needs to be bypassed.
 * 
 * @template P - The props of the component being wrapped.
 * @param {React.ComponentType<P>} Component - The component to wrap.
 * @returns {React.ComponentType<P>} The original component, unchanged.
 */
export const withDevToolsDisabled = <P extends object>(Component: React.ComponentType<P>): React.ComponentType<P> => {
  console.debug('[DevToolsFix] Using withDevToolsDisabled HOC for component:', Component.displayName || Component.name || 'UnknownComponent'); // Logging: Variable dump (component name)
  // Simply return the component itself, effectively bypassing any DevTools wrapping
  return Component;
};
