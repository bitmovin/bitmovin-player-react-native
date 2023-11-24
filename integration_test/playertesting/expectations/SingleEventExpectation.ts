import { Event } from 'bitmovin-player-react-native';
import { EventType } from '../EventType';
import { EventExpectationReportStatus } from './EventExpectationReportStatus';

export abstract class SingleEventExpectation {
  abstract readonly isFulfilled: boolean;
  abstract readonly eventType: EventType;
  abstract maybeFulfillExpectation(receivedEvent: any): boolean;
  abstract copy(): SingleEventExpectation;

  toString(): string {
    return this.buildDescription((isFulfilled) => {
      return isFulfilled
        ? EventExpectationReportStatus.Fulfilled
        : EventExpectationReportStatus.Unfulfilled;
    });
  }

  buildDescription(
    statusBuilder: (isFulfilled: boolean) => EventExpectationReportStatus
  ): string {
    return `${statusBuilder(this.isFulfilled)} ${this.eventType}`;
  }
}

// To expect an event of a given type to occur.
export class PlainEventExpectation extends SingleEventExpectation {
  readonly eventType: EventType;
  isFulfilled: boolean = false;

  constructor(eventType: EventType) {
    super();
    this.eventType = eventType;
  }

  maybeFulfillExpectation(receivedEvent: any): boolean {
    this.isFulfilled = receivedEvent.name === this.eventType;
    return this.isFulfilled;
  }

  copy(): SingleEventExpectation {
    return new PlainEventExpectation(this.eventType);
  }
}

// To expect an event of a given type with a certain condition to occur.
export class FilteredEventExpectation<
  E extends Event
> extends PlainEventExpectation {
  readonly filter: (event: E) => boolean;

  constructor(eventType: EventType, filter: (event: E) => boolean) {
    super(eventType);
    this.filter = filter;
  }

  maybeFulfillExpectation(receivedEvent: any): boolean {
    if (super.maybeFulfillExpectation(receivedEvent)) {
      this.isFulfilled = this.filter(receivedEvent as E);
    }
    return this.isFulfilled;
  }

  copy(): SingleEventExpectation {
    return new FilteredEventExpectation(this.eventType, this.filter);
  }
}

export class P extends PlainEventExpectation {}
export class F<E extends Event> extends FilteredEventExpectation<E> {}
