import { SignalLike, SignalSetter } from "../scope.ts";
import {
  Children,
  Component,
  ComponentType,
  FunctionComponent,
} from "./component.ts";
import { createContext } from "./context.ts";
import { When } from "./switch.ts";
import { Renderer } from "./renderer.ts";
import { RendererScope } from "./renderer_scope.ts";
import { Fragment } from "./fragment.ts";
import { Rendering } from "./rendering.ts";

type PendingComponentsSet = Set<Component>;

const AsyncContext = createContext<SignalSetter<PendingComponentsSet>>();

export interface SuspenseProps {
  fallback?: Component;
  children?: Children;
}

export class Suspense extends Component<SuspenseProps> {
  render<R extends Renderer>(s: RendererScope<R>): Rendering<R> {
    const [componentStatus, setComponentStatus] =
      s.signal<PendingComponentsSet>(new Set());
    const [rendering, setRendering] = s.signal<Rendering<R>>(
      this.props.fallback?.render(s) ?? new Rendering(s)
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

interface SuspenseInnerProps {
  rendering: SignalLike<Rendering<Renderer>>;
}

class SuspenseInner extends Component<SuspenseInnerProps> {
  render<R extends Renderer>(s: RendererScope<R>): Rendering<R> {
    const rendering = new Rendering(s);

    s.effect(() => {
      rendering.insert(this.props.rendering() as Rendering<R>, 0);

      s.cleanup(() => rendering.delete(0));
    });

    return rendering;
  }
}

interface AsyncComponentProps<P> {
  innerProps: P;
  asyncComponent: () => Promise<ComponentType<P>>;
}

class AsyncComponent<P> extends Component<AsyncComponentProps<P>> {
  render<R extends Renderer>(s: RendererScope<R>): Rendering<R> {
    const setComponentStatus = s.get(AsyncContext);
    if (setComponentStatus == null) return new Rendering(s);

    const [component, setComponent] = s.signal<Component>();

    s.effect(
      async () => {
        setComponentStatus((map) => map.add(this), {
          force: true,
        });

        try {
          const component = s.renderer.createComponent(
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

    return new When({
      condition: () => component() != null,
      then: component()!,
    }).render(s);
  }
}

export function lazy<P>(
  asyncComponent: () => Promise<{ default: ComponentType<P> }>
): FunctionComponent<P> {
  return (props) =>
    new AsyncComponent({
      innerProps: props,
      asyncComponent: () => asyncComponent().then((x) => x.default),
    });
}
