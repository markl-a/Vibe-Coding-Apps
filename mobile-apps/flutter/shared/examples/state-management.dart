/**
 * State Management Patterns for Flutter
 *
 * Comprehensive examples of state management using Provider, Riverpod, BLoC, and GetX
 * Includes reactive programming, dependency injection, and state persistence
 */

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get/get.dart';

// ============================================
// EXAMPLE 1: Provider - Simple State Management
// ============================================

// Counter Model with ChangeNotifier
class CounterProvider extends ChangeNotifier {
  int _count = 0;

  int get count => _count;

  void increment() {
    _count++;
    notifyListeners();
  }

  void decrement() {
    _count--;
    notifyListeners();
  }

  void reset() {
    _count = 0;
    notifyListeners();
  }
}

// Todo Model
class Todo {
  final String id;
  final String title;
  final bool completed;

  Todo({
    required this.id,
    required this.title,
    this.completed = false,
  });

  Todo copyWith({
    String? id,
    String? title,
    bool? completed,
  }) {
    return Todo(
      id: id ?? this.id,
      title: title ?? this.title,
      completed: completed ?? this.completed,
    );
  }
}

// Todo Provider with more complex state
class TodoProvider extends ChangeNotifier {
  final List<Todo> _todos = [];
  String _filter = 'all'; // all, active, completed

  List<Todo> get todos {
    switch (_filter) {
      case 'active':
        return _todos.where((todo) => !todo.completed).toList();
      case 'completed':
        return _todos.where((todo) => todo.completed).toList();
      default:
        return _todos;
    }
  }

  int get totalCount => _todos.length;
  int get activeCount => _todos.where((todo) => !todo.completed).length;
  int get completedCount => _todos.where((todo) => todo.completed).length;

  String get filter => _filter;

  void addTodo(String title) {
    final todo = Todo(
      id: DateTime.now().toString(),
      title: title,
    );
    _todos.add(todo);
    notifyListeners();
  }

  void toggleTodo(String id) {
    final index = _todos.indexWhere((todo) => todo.id == id);
    if (index != -1) {
      _todos[index] = _todos[index].copyWith(
        completed: !_todos[index].completed,
      );
      notifyListeners();
    }
  }

  void removeTodo(String id) {
    _todos.removeWhere((todo) => todo.id == id);
    notifyListeners();
  }

  void setFilter(String filter) {
    _filter = filter;
    notifyListeners();
  }

  void clearCompleted() {
    _todos.removeWhere((todo) => todo.completed);
    notifyListeners();
  }
}

// Widget using Provider
class ProviderExample extends StatelessWidget {
  const ProviderExample({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => CounterProvider()),
        ChangeNotifierProvider(create: (_) => TodoProvider()),
      ],
      child: const ProviderScreen(),
    );
  }
}

class ProviderScreen extends StatelessWidget {
  const ProviderScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Access provider data
    final counter = context.watch<CounterProvider>();
    final todoProvider = context.watch<TodoProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Provider Example')),
      body: Column(
        children: [
          // Counter section
          Card(
            margin: const EdgeInsets.all(16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const Text('Counter', style: TextStyle(fontSize: 20)),
                  Text('${counter.count}', style: const TextStyle(fontSize: 40)),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      ElevatedButton(
                        onPressed: counter.decrement,
                        child: const Text('-'),
                      ),
                      const SizedBox(width: 16),
                      ElevatedButton(
                        onPressed: counter.increment,
                        child: const Text('+'),
                      ),
                      const SizedBox(width: 16),
                      ElevatedButton(
                        onPressed: counter.reset,
                        child: const Text('Reset'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          // Todo section
          Expanded(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          decoration: const InputDecoration(
                            hintText: 'Add a todo',
                            border: OutlineInputBorder(),
                          ),
                          onSubmitted: (value) {
                            if (value.isNotEmpty) {
                              todoProvider.addTodo(value);
                            }
                          },
                        ),
                      ),
                    ],
                  ),
                ),
                // Filter buttons
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    FilterChip(
                      label: const Text('All'),
                      selected: todoProvider.filter == 'all',
                      onSelected: (_) => todoProvider.setFilter('all'),
                    ),
                    const SizedBox(width: 8),
                    FilterChip(
                      label: const Text('Active'),
                      selected: todoProvider.filter == 'active',
                      onSelected: (_) => todoProvider.setFilter('active'),
                    ),
                    const SizedBox(width: 8),
                    FilterChip(
                      label: const Text('Completed'),
                      selected: todoProvider.filter == 'completed',
                      onSelected: (_) => todoProvider.setFilter('completed'),
                    ),
                  ],
                ),
                // Todo list
                Expanded(
                  child: ListView.builder(
                    itemCount: todoProvider.todos.length,
                    itemBuilder: (context, index) {
                      final todo = todoProvider.todos[index];
                      return ListTile(
                        leading: Checkbox(
                          value: todo.completed,
                          onChanged: (_) => todoProvider.toggleTodo(todo.id),
                        ),
                        title: Text(
                          todo.title,
                          style: TextStyle(
                            decoration: todo.completed
                                ? TextDecoration.lineThrough
                                : null,
                          ),
                        ),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete),
                          onPressed: () => todoProvider.removeTodo(todo.id),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================
// EXAMPLE 2: Riverpod - Modern State Management
// ============================================

// State Notifier for Counter
class CounterNotifier extends StateNotifier<int> {
  CounterNotifier() : super(0);

  void increment() => state++;
  void decrement() => state--;
  void reset() => state = 0;
}

// Providers
final counterProvider = StateNotifierProvider<CounterNotifier, int>((ref) {
  return CounterNotifier();
});

// User Model
class User {
  final String id;
  final String name;
  final String email;

  User({required this.id, required this.name, required this.email});
}

// Future Provider for async data
final userProvider = FutureProvider<User>((ref) async {
  // Simulate API call
  await Future.delayed(const Duration(seconds: 2));
  return User(id: '1', name: 'John Doe', email: 'john@example.com');
});

// Family provider (parameterized)
final userByIdProvider = FutureProvider.family<User, String>((ref, userId) async {
  // Simulate API call with ID
  await Future.delayed(const Duration(seconds: 1));
  return User(id: userId, name: 'User $userId', email: 'user$userId@example.com');
});

// Stream Provider
final timeProvider = StreamProvider<DateTime>((ref) {
  return Stream.periodic(
    const Duration(seconds: 1),
    (_) => DateTime.now(),
  );
});

// Riverpod Widget
class RiverpodExample extends ConsumerWidget {
  const RiverpodExample({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Watch providers
    final counter = ref.watch(counterProvider);
    final userAsync = ref.watch(userProvider);
    final timeAsync = ref.watch(timeProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Riverpod Example')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Counter
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const Text('Counter', style: TextStyle(fontSize: 20)),
                  Text('$counter', style: const TextStyle(fontSize: 40)),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      ElevatedButton(
                        onPressed: () => ref.read(counterProvider.notifier).decrement(),
                        child: const Text('-'),
                      ),
                      const SizedBox(width: 16),
                      ElevatedButton(
                        onPressed: () => ref.read(counterProvider.notifier).increment(),
                        child: const Text('+'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Future Provider
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('User Data (Future)', style: TextStyle(fontSize: 20)),
                  const SizedBox(height: 8),
                  userAsync.when(
                    data: (user) => Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Name: ${user.name}'),
                        Text('Email: ${user.email}'),
                      ],
                    ),
                    loading: () => const CircularProgressIndicator(),
                    error: (error, stack) => Text('Error: $error'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Stream Provider
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Current Time (Stream)', style: TextStyle(fontSize: 20)),
                  const SizedBox(height: 8),
                  timeAsync.when(
                    data: (time) => Text(
                      '${time.hour}:${time.minute}:${time.second}',
                      style: const TextStyle(fontSize: 24),
                    ),
                    loading: () => const CircularProgressIndicator(),
                    error: (error, stack) => Text('Error: $error'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================
// EXAMPLE 3: BLoC - Business Logic Component
// ============================================

// Counter Events
abstract class CounterEvent {}

class IncrementEvent extends CounterEvent {}

class DecrementEvent extends CounterEvent {}

class ResetEvent extends CounterEvent {}

// Counter BLoC
class CounterBloc extends Bloc<CounterEvent, int> {
  CounterBloc() : super(0) {
    on<IncrementEvent>((event, emit) {
      emit(state + 1);
    });

    on<DecrementEvent>((event, emit) {
      emit(state - 1);
    });

    on<ResetEvent>((event, emit) {
      emit(0);
    });
  }
}

// Todo Events
abstract class TodoEvent {}

class AddTodoEvent extends TodoEvent {
  final String title;
  AddTodoEvent(this.title);
}

class ToggleTodoEvent extends TodoEvent {
  final String id;
  ToggleTodoEvent(this.id);
}

class RemoveTodoEvent extends TodoEvent {
  final String id;
  RemoveTodoEvent(this.id);
}

// Todo State
class TodoState {
  final List<Todo> todos;
  final bool isLoading;
  final String? error;

  TodoState({
    this.todos = const [],
    this.isLoading = false,
    this.error,
  });

  TodoState copyWith({
    List<Todo>? todos,
    bool? isLoading,
    String? error,
  }) {
    return TodoState(
      todos: todos ?? this.todos,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

// Todo BLoC
class TodoBloc extends Bloc<TodoEvent, TodoState> {
  TodoBloc() : super(TodoState()) {
    on<AddTodoEvent>((event, emit) {
      final newTodo = Todo(
        id: DateTime.now().toString(),
        title: event.title,
      );
      emit(state.copyWith(todos: [...state.todos, newTodo]));
    });

    on<ToggleTodoEvent>((event, emit) {
      final todos = state.todos.map((todo) {
        if (todo.id == event.id) {
          return todo.copyWith(completed: !todo.completed);
        }
        return todo;
      }).toList();
      emit(state.copyWith(todos: todos));
    });

    on<RemoveTodoEvent>((event, emit) {
      final todos = state.todos.where((todo) => todo.id != event.id).toList();
      emit(state.copyWith(todos: todos));
    });
  }
}

// BLoC Widget
class BlocExample extends StatelessWidget {
  const BlocExample({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (_) => CounterBloc()),
        BlocProvider(create: (_) => TodoBloc()),
      ],
      child: const BlocScreen(),
    );
  }
}

class BlocScreen extends StatelessWidget {
  const BlocScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('BLoC Example')),
      body: Column(
        children: [
          // Counter BLoC
          BlocBuilder<CounterBloc, int>(
            builder: (context, count) {
              return Card(
                margin: const EdgeInsets.all(16),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      const Text('Counter (BLoC)', style: TextStyle(fontSize: 20)),
                      Text('$count', style: const TextStyle(fontSize: 40)),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          ElevatedButton(
                            onPressed: () {
                              context.read<CounterBloc>().add(DecrementEvent());
                            },
                            child: const Text('-'),
                          ),
                          const SizedBox(width: 16),
                          ElevatedButton(
                            onPressed: () {
                              context.read<CounterBloc>().add(IncrementEvent());
                            },
                            child: const Text('+'),
                          ),
                          const SizedBox(width: 16),
                          ElevatedButton(
                            onPressed: () {
                              context.read<CounterBloc>().add(ResetEvent());
                            },
                            child: const Text('Reset'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          // Todo BLoC
          Expanded(
            child: BlocBuilder<TodoBloc, TodoState>(
              builder: (context, state) {
                return ListView.builder(
                  itemCount: state.todos.length,
                  itemBuilder: (context, index) {
                    final todo = state.todos[index];
                    return ListTile(
                      leading: Checkbox(
                        value: todo.completed,
                        onChanged: (_) {
                          context.read<TodoBloc>().add(ToggleTodoEvent(todo.id));
                        },
                      ),
                      title: Text(todo.title),
                      trailing: IconButton(
                        icon: const Icon(Icons.delete),
                        onPressed: () {
                          context.read<TodoBloc>().add(RemoveTodoEvent(todo.id));
                        },
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          context.read<TodoBloc>().add(AddTodoEvent('New Todo'));
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}

// ============================================
// EXAMPLE 4: GetX - Simple State Management
// ============================================

// GetX Controller
class GetXCounterController extends GetxController {
  final count = 0.obs;

  void increment() => count.value++;
  void decrement() => count.value--;
  void reset() => count.value = 0;
}

// GetX Widget
class GetXExample extends StatelessWidget {
  const GetXExample({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Initialize controller
    final controller = Get.put(GetXCounterController());

    return Scaffold(
      appBar: AppBar(title: const Text('GetX Example')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('Counter (GetX)', style: TextStyle(fontSize: 20)),
            Obx(() => Text(
                  '${controller.count}',
                  style: const TextStyle(fontSize: 40),
                )),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton(
                  onPressed: controller.decrement,
                  child: const Text('-'),
                ),
                const SizedBox(width: 16),
                ElevatedButton(
                  onPressed: controller.increment,
                  child: const Text('+'),
                ),
                const SizedBox(width: 16),
                ElevatedButton(
                  onPressed: controller.reset,
                  child: const Text('Reset'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/**
 * USAGE NOTES:
 *
 * 1. Add dependencies to pubspec.yaml:
 *    dependencies:
 *      provider: ^6.0.0
 *      flutter_riverpod: ^2.0.0
 *      flutter_bloc: ^8.0.0
 *      get: ^4.6.0
 *
 * 2. Provider:
 *    - Best for simple to medium complexity
 *    - Uses InheritedWidget under the hood
 *    - Good integration with Flutter
 *
 * 3. Riverpod:
 *    - Compile-safe provider
 *    - No BuildContext needed
 *    - Better testability
 *    - Supports async operations natively
 *
 * 4. BLoC:
 *    - Best for complex state management
 *    - Clear separation of business logic
 *    - Great for large teams
 *    - Testable and scalable
 *
 * 5. GetX:
 *    - Simplest and fastest
 *    - Minimal boilerplate
 *    - Built-in dependency injection
 *    - Includes routing and internationalization
 */
