import SwiftUI

struct ContentView: View {
    @State private var viewModel = TodoViewModel()
    @State private var showingAddSheet = false
    @State private var selectedTodo: Todo?

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // 統計卡片
                StatsView(stats: viewModel.stats)
                    .padding()
                    .background(Color(.systemGroupedBackground))

                Divider()

                // 篩選器
                FilterPickerView(selection: $viewModel.filterOption)
                    .padding(.horizontal)
                    .padding(.vertical, 8)

                // 待辦列表
                if viewModel.filteredTodos.isEmpty {
                    EmptyStateView(filterOption: viewModel.filterOption)
                } else {
                    List {
                        ForEach(viewModel.filteredTodos) { todo in
                            TodoRowView(todo: todo) {
                                viewModel.toggleComplete(todo)
                            }
                            .contentShape(Rectangle())
                            .onTapGesture {
                                selectedTodo = todo
                            }
                        }
                        .onDelete(perform: viewModel.deleteTodos)
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("待辦事項")
            .navigationBarTitleDisplayMode(.large)
            .searchable(text: $viewModel.searchText, prompt: "搜尋待辦事項")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showingAddSheet = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                            .symbolRenderingMode(.hierarchical)
                    }
                }

                if !viewModel.todos.filter({ $0.isCompleted }).isEmpty {
                    ToolbarItem(placement: .bottomBar) {
                        Button(role: .destructive) {
                            viewModel.deleteAllCompleted()
                        } label: {
                            Label("清除已完成", systemImage: "trash")
                        }
                    }
                }
            }
            .sheet(isPresented: $showingAddSheet) {
                AddTodoView { todo in
                    viewModel.addTodo(todo)
                }
            }
            .sheet(item: $selectedTodo) { todo in
                EditTodoView(todo: todo) { updatedTodo in
                    viewModel.updateTodo(updatedTodo)
                }
            }
        }
    }
}

#Preview {
    ContentView()
}
