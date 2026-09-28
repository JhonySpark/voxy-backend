import { describe, it, expect } from 'vitest';
import { AggregateRoot } from './aggregate-root.base.js';

interface TestProps {
  title: string;
}

class TestAggregate extends AggregateRoot<TestProps> {
  constructor(props: TestProps, id?: string) {
    super(props, id);
  }

  public recordChange(event: any) {
    this.addDomainEvent(event);
  }
}

describe('AggregateRoot Base', () => {
  it('should manage domain events', () => {
    const aggregate = new TestAggregate({ title: 'Root' });
    expect(aggregate.domainEvents).toHaveLength(0);

    aggregate.recordChange({ eventName: 'ItemCreated' });
    aggregate.recordChange({ eventName: 'ItemUpdated' });

    expect(aggregate.domainEvents).toHaveLength(2);
    expect(aggregate.domainEvents[0].eventName).toBe('ItemCreated');

    aggregate.clearEvents();
    expect(aggregate.domainEvents).toHaveLength(0);
  });
});
