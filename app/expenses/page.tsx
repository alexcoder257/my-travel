"use client";

import { useTrip } from "@/hooks/useTrip";
import { useExpenses } from "@/hooks/useExpenses";
import { ExpenseForm } from "@/components/ExpenseForm";
import { deleteExpense } from "@/lib/firestore";
import { Loader, X } from "lucide-react";

export default function ExpensesPage() {
  const { trip, loading: tripLoading } = useTrip();
  const { expenses, loading: expensesLoading, summary, categoryBreakdown } =
    useExpenses(trip);

  const handleDelete = async (expenseId: string) => {
    if (confirm("Delete this expense?")) {
      try {
        await deleteExpense(expenseId);
      } catch (error) {
        console.error("Failed to delete:", error);
      }
    }
  };

  if (tripLoading || expensesLoading || !trip || !summary) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    food: "bg-orange-100 text-orange-800",
    transport: "bg-blue-100 text-blue-800",
    activity: "bg-purple-100 text-purple-800",
    shopping: "bg-pink-100 text-pink-800",
    other: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Expenses</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Add Form */}
        <div className="lg:col-span-1 sticky top-24 h-fit">
          <ExpenseForm />
        </div>

        {/* Summary & List */}
        <div className="lg:col-span-2 space-y-8">
          {/* Budget Summary */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Summary</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Estimated</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {summary.estimated.VND.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Actual</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {summary.actual.VND.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Singapore Budget</span>
                <span className="font-medium">
                  {summary.actual.SGD}/{trip.budget.SGD} SGD
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    summary.actual.SGD > trip.budget.SGD
                      ? "bg-red-500"
                      : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      (summary.actual.SGD / trip.budget.SGD) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>

              <div className="flex justify-between mt-4">
                <span className="text-sm text-gray-600">Malaysia Budget</span>
                <span className="font-medium">
                  {summary.actual.MYR}/{trip.budget.MYR} MYR
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    summary.actual.MYR > trip.budget.MYR
                      ? "bg-red-500"
                      : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      (summary.actual.MYR / trip.budget.MYR) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          {Object.keys(categoryBreakdown).length > 0 && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                By Category
              </h2>
              <div className="space-y-3">
                {Object.entries(categoryBreakdown).map(([category, total]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </span>
                    <span className="font-semibold">
                      {total.toLocaleString()} VND
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expense List */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Expenses ({expenses.length})
            </h2>

            <div className="space-y-3">
              {expenses.length === 0 ? (
                <p className="text-gray-500 text-sm">No expenses yet</p>
              ) : (
                expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs px-2 py-1 rounded font-medium ${
                            categoryColors[expense.category]
                          }`}
                        >
                          {expense.category}
                        </span>
                        <p className="font-medium text-gray-900">
                          {expense.description}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {expense.date.toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {expense.amount}
                        </p>
                        <p className="text-xs text-gray-500">
                          {expense.currency}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
