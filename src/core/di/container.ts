/**
 * Lightweight, framework-agnostic dependency injection container.
 *
 * Why not tsyringe / inversify? They rely on `reflect-metadata` and
 * decorators which conflict with the React Server Components compiler and
 * add a non-trivial runtime cost on the edge. A small, explicit container is
 * easier to reason about, fully tree-shakeable, and supports SSR/edge.
 */

export type Token<T> = symbol & { __type?: T };

export type Lifecycle = "singleton" | "transient" | "scoped";

interface Registration<T> {
  factory: (c: Container) => T;
  lifecycle: Lifecycle;
  instance?: T;
}

export function createToken<T>(description: string): Token<T> {
  return Symbol(description) as Token<T>;
}

export class Container {
  private readonly registrations = new Map<symbol, Registration<unknown>>();
  private readonly scopedInstances = new Map<symbol, unknown>();
  private readonly parent?: Container;

  constructor(parent?: Container) {
    this.parent = parent;
  }

  register<T>(token: Token<T>, factory: (c: Container) => T, lifecycle: Lifecycle = "singleton"): this {
    this.registrations.set(token, { factory, lifecycle } as Registration<unknown>);
    return this;
  }

  registerValue<T>(token: Token<T>, value: T): this {
    this.registrations.set(token, {
      factory: () => value,
      lifecycle: "singleton",
      instance: value,
    } as Registration<unknown>);
    return this;
  }

  resolve<T>(token: Token<T>): T {
    const reg = this.registrations.get(token) as Registration<T> | undefined;

    if (!reg) {
      if (this.parent) return this.parent.resolve(token);
      throw new Error(`No registration found for token: ${token.description ?? "(anonymous)"}`);
    }

    switch (reg.lifecycle) {
      case "singleton": {
        if (reg.instance === undefined) {
          reg.instance = reg.factory(this);
        }
        return reg.instance;
      }
      case "scoped": {
        const cached = this.scopedInstances.get(token);
        if (cached !== undefined) return cached as T;
        const created = reg.factory(this);
        this.scopedInstances.set(token, created);
        return created;
      }
      case "transient":
      default:
        return reg.factory(this);
    }
  }

  /** Create a child scope (e.g. per-request). Singletons are shared, scoped become fresh. */
  createScope(): Container {
    return new Container(this);
  }

  /** Clear all scoped instances (e.g. at the end of a request). */
  clearScope(): void {
    this.scopedInstances.clear();
  }
}
