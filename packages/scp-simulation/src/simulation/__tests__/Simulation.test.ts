import { Simulation, SimulationStep } from '../Simulation';
import { Context } from '../../core/Context';
import { UserAction } from '../../core/UserAction';
import { ProtocolAction } from '../../core/ProtocolAction';
import { Event } from '../../core/Event';
import { mock, MockProxy } from 'jest-mock-extended';

describe('Simulation Class', () => {
	let simulation: Simulation;
	let context: MockProxy<Context>;

	beforeEach(() => {
		context = mock<Context>();
		context.executeActions.mockReturnValue([]);
		context.getOverlaySettings.mockReturnValue({
			fullyConnected: false,
			gossipEnabled: false
		});
		simulation = new Simulation(context);
	});

	it('should initialize with empty actions and events', () => {
		expect(simulation.pendingUserActions()).toEqual([]);
		expect(simulation.pendingProtocolActions()).toEqual([]);
		expect(simulation.getFullEventLog()).toEqual([[]]);
		expect(simulation.hasNextStep()).toBe(false);
		expect(simulation.hasPreviousStep()).toBe(false);
	});

	it('should add user actions correctly', () => {
		const userAction = mock<UserAction>();
		simulation.addUserAction(userAction);
		expect(simulation.pendingUserActions()).toEqual([userAction]);
	});

	it('should execute step and process actions', () => {
		const userAction = mock<UserAction>();
		const generatedProtocolAction = mock<ProtocolAction>();

		context.executeActions.mockReturnValue([generatedProtocolAction]);

		simulation.addUserAction(userAction);
		simulation.executeStep();

		// After execution, pending user actions should be empty
		expect(simulation.pendingUserActions()).toEqual([]);
		expect(simulation.pendingProtocolActions()).toEqual([
			generatedProtocolAction
		]);

		expect(context.executeActions).toHaveBeenCalledWith([], [userAction]);
	});

	it('should go back one step', () => {
		const userAction = mock<UserAction>();
		const generatedProtocolAction = mock<ProtocolAction>();

		context.executeActions.mockReturnValue([generatedProtocolAction]);

		simulation.addUserAction(userAction);
		simulation.executeStep();

		expect(simulation.hasPreviousStep()).toBe(true);

		simulation.goBackOneStep();

		// After going back, user actions should be pending again
		expect(simulation.pendingUserActions()).toEqual([userAction]);
		expect(simulation.pendingProtocolActions()).toEqual([]);
	});

	it('should replay state when going back one step', () => {
		const resetSpy = jest.spyOn(context, 'reset');
		const userAction = mock<UserAction>();

		context.executeActions.mockReturnValue([]);

		simulation.addUserAction(userAction);
		simulation.executeStep();

		const secondUserAction = mock<UserAction>();
		simulation.addUserAction(secondUserAction);
		simulation.executeStep();

		simulation.goBackOneStep();
		expect(resetSpy).toHaveBeenCalled();
		expect(context.executeActions).toHaveBeenCalledTimes(3);
	});

	it('should reset state when going to first step and reset to the first pending user actions', () => {
		const resetSpy = jest.spyOn(context, 'reset');

		const userAction = mock<UserAction>();

		context.executeActions.mockReturnValue([]);
		simulation.addUserAction(userAction);
		simulation.executeStep();

		const secondUserAction = mock<UserAction>();
		context.executeActions.mockReturnValue([]);
		simulation.addUserAction(secondUserAction);
		simulation.executeStep();

		simulation.goToFirstStep();

		// Context reset should be called
		expect(resetSpy).toHaveBeenCalled();

		// Simulation should now be at initial state with the first user actions ready to execute
		expect(simulation.pendingUserActions()).toEqual([userAction]);
		expect(simulation.pendingProtocolActions()).toEqual([]);
		expect(simulation.hasPreviousStep()).toBe(false);

		//executActions should not have been called again after reset
		expect(context.executeActions).toHaveBeenCalledTimes(2);
		expect(context.drainEvents).toHaveBeenCalledTimes(3);
	});

	it('should get full event log', () => {
		const userAction = mock<UserAction>();
		userAction.execute.mockReturnValue([]);
		simulation.addUserAction(userAction);

		const event1 = mock<Event>();
		(context.drainEvents as jest.Mock).mockReturnValue([event1]);
		simulation.executeStep();

		const event2 = mock<Event>();
		(context.drainEvents as jest.Mock).mockReturnValue([event2]);
		simulation.executeStep();

		const eventLog = simulation.getFullEventLog();

		expect(eventLog).toEqual([[], [event1], [event2]]);
	});

	it('should correctly set initial step when supplied in constructor', () => {
		const initialStep = mock<SimulationStep>();
		initialStep.userActions = [];
		simulation = new Simulation(context, initialStep);
		const userAction = mock<UserAction>();
		simulation.addUserAction(userAction);
		expect(initialStep.userActions).toEqual([userAction]);
		expect(simulation.getInitialStep()).toBe(initialStep);
	});
});
