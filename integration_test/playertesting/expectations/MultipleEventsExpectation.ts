import { Event } from 'bitmovin-player-react-native';
import {
  PlainEventExpectation,
  SingleEventExpectation,
} from './SingleEventExpectation';
import { EventType } from '../EventType';
import { EventExpectationReportStatus } from './EventExpectationReportStatus';

export abstract class MultipleEventsExpectation {
  abstract singleExpectations: SingleEventExpectation[];
  abstract get expectedFulfillmentCount(): number;
  abstract isNextExpectationMet(receivedEvent: Event): boolean;
}

// To expect a given event sequence in a given order.
export class EventSequenceExpectation extends MultipleEventsExpectation {
  singleExpectations: SingleEventExpectation[];

  constructor(
    singleExpectationConvertibles: SingleEventExpectation[] | EventType[]
  ) {
    super();
    this.singleExpectations = singleExpectationConvertibles.map(
      (singleExpectationConvertible) =>
        singleExpectationConvertible instanceof SingleEventExpectation
          ? singleExpectationConvertible
          : new PlainEventExpectation(singleExpectationConvertible as EventType)
    );
  }

  get expectedFulfillmentCount(): number {
    return this.singleExpectations.length;
  }

  isNextExpectationMet(receivedEvent: Event): boolean {
    const nextUnfulfilled = this.singleExpectations.find(
      (expectation) => !expectation.isFulfilled
    );
    if (!nextUnfulfilled) {
      return true;
    }

    return nextUnfulfilled.maybeFulfillExpectation(receivedEvent);
  }

  toString(): string {
    let firstUnfulfilledIndex = this.singleExpectations.findIndex(
      (expectation) => !expectation.isFulfilled
    );

    return this.singleExpectations
      .map((expectation, index) => {
        return expectation.buildDescription((isFulfilled) => {
          if (firstUnfulfilledIndex !== -1 && index > firstUnfulfilledIndex) {
            return EventExpectationReportStatus.Invalid;
          }
          return isFulfilled
            ? EventExpectationReportStatus.Fulfilled
            : EventExpectationReportStatus.Unfulfilled;
        });
      })
      .join(' - ');
  }
}

// To expect multiple events in any order.
export class EventBagExpectation extends MultipleEventsExpectation {
  readonly singleExpectations: SingleEventExpectation[];

  constructor(
    singleExpectationConvertibles: SingleEventExpectation[] | EventType[]
  ) {
    super();
    this.singleExpectations = singleExpectationConvertibles.map(
      (singleExpectationConvertible) =>
        singleExpectationConvertible instanceof SingleEventExpectation
          ? singleExpectationConvertible
          : new PlainEventExpectation(singleExpectationConvertible as EventType)
    );
  }

  get expectedFulfillmentCount(): number {
    return this.singleExpectations.length;
  }

  isNextExpectationMet(receivedEvent: Event): boolean {
    const nextUnfulfilled = this.singleExpectations.find(
      (expectation) =>
        !expectation.isFulfilled &&
        expectation.maybeFulfillExpectation(receivedEvent)
    );

    return nextUnfulfilled?.isFulfilled ?? false;
  }

  toString(): string {
    return this.singleExpectations
      .map((expectation) => expectation.toString())
      .join(' - ');
  }
}

// To expect a given eventType to happen multiple times.
export class RepeatedEventExpectation extends EventSequenceExpectation {
  constructor(
    singleExpectationConvertible: SingleEventExpectation | EventType,
    count: number
  ) {
    const singleExpectation =
      singleExpectationConvertible instanceof SingleEventExpectation
        ? singleExpectationConvertible
        : new PlainEventExpectation(singleExpectationConvertible as EventType);
    super(Array.from({ length: count }, () => singleExpectation.copy()));
  }
}

// To expect at least one out of multiple events.
export class AnyEventExpectation extends MultipleEventsExpectation {
  readonly singleExpectations: SingleEventExpectation[];

  constructor(
    singleExpectationConvertibles: SingleEventExpectation[] | EventType[]
  ) {
    super();
    this.singleExpectations = singleExpectationConvertibles.map(
      (singleExpectationConvertible) =>
        singleExpectationConvertible instanceof SingleEventExpectation
          ? singleExpectationConvertible
          : new PlainEventExpectation(singleExpectationConvertible as EventType)
    );
  }

  get expectedFulfillmentCount(): number {
    return 1;
  }

  isNextExpectationMet(receivedEvent: Event): boolean {
    const nextUnfulfilled = this.singleExpectations.find((expectation) =>
      expectation.maybeFulfillExpectation(receivedEvent)
    );

    return nextUnfulfilled?.isFulfilled ?? false;
  }

  toString(): string {
    return this.singleExpectations
      .map((expectation) => expectation.toString())
      .join(' - ');
  }
}

export function EventSequence(
  singleExpectationConvertibles: SingleEventExpectation[] | EventType[]
): EventSequenceExpectation {
  return new EventSequenceExpectation(singleExpectationConvertibles);
}

export function EventBag(
  singleExpectationConvertibles: SingleEventExpectation[] | EventType[]
): EventBagExpectation {
  return new EventBagExpectation(singleExpectationConvertibles);
}

export function RepeatedEvent(
  singleExpectationConvertible: SingleEventExpectation | EventType,
  count: number
): EventSequenceExpectation {
  return new RepeatedEventExpectation(singleExpectationConvertible, count);
}

export function AnyEvent(
  singleExpectationConvertibles: SingleEventExpectation[] | EventType[]
): AnyEventExpectation {
  return new AnyEventExpectation(singleExpectationConvertibles);
}
