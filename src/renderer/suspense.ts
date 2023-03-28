import { SignalLike, SignalSetter } from "../scope.ts";
import {
  Children,
  Component,
  ComponentType,
  FunctionComponent,
} from "./component.ts";
import { createContext } from "./context.ts";
import { When } from "./switch.ts";
import { Renderer, Rendering } from "./renderer.ts";
import { RendererScope } from "./renderer_scope.ts";
import { Fragment } from "./fragment.ts";

type PendingComponentsSet = Set<Component>;

const AsyncContext = createContext<SignalSetter<PendingComponentsSet>>();

export interface SuspenseProps<R extends Renderer> {
  fallback?: Component<any, R>;
  children?: Children<R>;
}

export class Suspense<R extends Renderer> extends Component<
  SuspenseProps<R>,
  R
> {
  render(s: RendererScope<R>): Rendering<R> {
    const [componentStatus, setComponentStatus] =
      s.signal<PendingComponentsSet>(new Set());
    const [rendering, setRendering] = s.signal<Rendering<R>>(
      this.props.fallback?.render(s) ?? []
    );

    s.effect(
      () => {
        const resolvedRendering = new Fragment({
          children: this.props.children,
        }).render(s);

        if (componentStatus.track().size === 0) {
          setRendering(resolvedRendering);
        }
      },
      { untracked: true }
    );

    return new AsyncContext.Provider({
      value: setComponentStatus,
      children: [new SuspenseInner({ rendering })],
    }).render(s);
  }
}

interface SuspenseInnerProps<R extends Renderer> {
  rendering: SignalLike<Rendering<R>>;
}

class SuspenseInner<R extends Renderer> extends Component<
  SuspenseInnerProps<R>,
  R
> {
  render(s: RendererScope<R>): Rendering<R> {
    const rendering: Rendering<R> = [];

    s.effect(() => {
      s.renderer.insertIntoRendering(this.props.rendering(), rendering, 0);

      s.cleanup(() => s.renderer.removeFromRendering(rendering, 0));
    });

    return rendering;
  }
}

interface AsyncComponentProps<P, R extends Renderer> {
  innerProps: P;
  asyncComponent: () => Promise<ComponentType<P, R>>;
}

class AsyncComponent<P, R extends Renderer> extends Component<
  AsyncComponentProps<P, R>,
  R
> {
  render(s: RendererScope<R>): Rendering<R> {
    const setComponentStatus = s.context(AsyncContext);
    if (setComponentStatus == null) return [];

    const [component, setComponent] = s.signal<Component<any, R>>();

    s.effect(
      async () => {
        setComponentStatus((map) => map.add(this), {
          force: true,
        });

        try {
          const component = s.createComponent(
            await this.props.asyncComponent(),
            this.props.innerProps
          );

          setComponent(component);
        } catch (err) {
          // ignore
        }

        setComponentStatus(
          (map) => {
            map.delete(this);
            return map;
          },
          { force: true }
        );
      },
      { untracked: true }
    );

    return new When<R>({
      condition: () => component() != null,
      then: component()!,
    }).render(s);
  }
}

export function lazy<P, R extends Renderer>(
  asyncComponent: () => Promise<{ default: ComponentType<P, R> }>
): FunctionComponent<P, R> {
  return (props) =>
    new AsyncComponent({
      innerProps: props,
      asyncComponent: () => asyncComponent().then((x) => x.default),
    });
}
