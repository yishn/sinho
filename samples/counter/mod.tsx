import {
  Component,
  defineComponents,
  event,
  FunctionalComponent,
  If,
  prop,
  Template,
  useMountEffect,
  useRef,
  useSignal,
} from "shingo";

const HostDisplayBlock: FunctionalComponent = () => (
  <style>{`:host { display: block; }`}</style>
);

export class Counter extends Component({
  count: prop<number>(0, {
    attribute: Number,
  }),
  onIncrementClick: event(MouseEvent),
  onDecrementClick: event(MouseEvent),
}) {
  static tagName = "counter-component";

  render(): Template {
    return (
      <>
        <h1 part="display">Counter: {this.props.count}</h1>

        <p>
          <button
            part="decrement"
            onclick={(evt) => this.events.onDecrementClick(evt)}
          >
            Decrement
          </button>{" "}
          <button
            part="increment"
            onclick={(evt) => this.events.onIncrementClick(evt)}
          >
            Increment
          </button>
        </p>

        <HostDisplayBlock />
      </>
    );
  }
}

class App extends Component({}, { shadowDOM: false }) {
  static tagName = "app-component";

  render(): Template {
    const [count, setCount] = useSignal(1);
    const [showCounter, setShowCounter] = useSignal(true);
    const ref = useRef<Counter>();

    useMountEffect(() => {
      console.log("Counter component is:", ref());
      console.log("Number of children:", this.children.length);
    });

    return (
      <>
        <p>
          <label>
            <input
              type="checkbox"
              checked={showCounter}
              onchange={() => setShowCounter((show) => !show)}
            />{" "}
            Show Counter
          </label>
        </p>

        <If
          condition={showCounter}
          then={
            <Counter
              ref={ref}
              id="counter"
              count={count}
              onIncrementClick={() => setCount((n) => n + 1)}
              onDecrementClick={() => setCount((n) => n - 1)}
            />
          }
        />

        <HostDisplayBlock />
      </>
    );
  }
}

defineComponents(Counter, App);
