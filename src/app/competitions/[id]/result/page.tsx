import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import React from "react";

type Result = {
  rank: number;
  name: string;
  best: string;
  average: string;
  country?: string;
  solves: string[];
};

const SAMPLE_RESULTS: Result[] = [
  {
    rank: 1,
    name: "Temuulen Tserendagva",
    best: "6.01",
    average: "8.03",
    country: "🇲🇳",
    solves: ["7.41", "8.44", "(9.63)", "8.23", "(6.01)"],
  },
  {
    rank: 2,
    name: "Gegeenbileg Naranchimeg",
    best: "7.55",
    average: "8.24",
    country: "🇲🇳",
    solves: ["8.18", "8.78", "(7.55)", "(9.28)", "7.77"],
  },
  {
    rank: 3,
    name: "Khuslen Narmandakh",
    best: "7.37",
    average: "8.35",
    country: "🇲🇳",
    solves: ["(9.19)", "8.48", "(7.37)", "8.29", "8.28"],
  },
  {
    rank: 4,
    name: "Bilguun Sukhbaatar",
    best: "7.57",
    average: "8.39",
    country: "🇲🇳",
    solves: ["8.39", "(10.89)", "(7.57)", "8.13", "8.64"],
  },
  {
    rank: 5,
    name: "Orgil Otgonbayar",
    best: "7.55",
    average: "8.54",
    country: "🇲🇳",
    solves: ["9.04", "(7.55)", "(9.51)", "8.20", "8.38"],
  },
  {
    rank: 6,
    name: "Erkhemkhishig Batmunkh",
    best: "7.94",
    average: "9.05",
    country: "🇲🇳",
    solves: ["(11.49)", "8.33", "(7.94)", "9.68", "9.14"],
  },
  {
    rank: 7,
    name: "Chinguun Munkhbat",
    best: "8.46",
    average: "9.20",
    country: "🇲🇳",
    solves: ["(9.95)", "9.34", "(8.46)", "8.64", "9.61"],
  },
  {
    rank: 8,
    name: "Temuulen Munkhtushig",
    best: "7.39",
    average: "9.48",
    country: "🇲🇳",
    solves: ["9.32", "(11.74)", "10.46", "8.67", "(7.39)"],
  },
  {
    rank: 9,
    name: "Myagmardorj Ulziijargal",
    best: "8.40",
    average: "9.55",
    country: "🇲🇳",
    solves: ["9.71", "9.08", "9.86", "(12.38)", "(8.40)"],
  },
  {
    rank: 10,
    name: "Margad Otgon-Ulzii",
    best: "8.40",
    average: "9.93",
    country: "🇲🇳",
    solves: ["(21.12)", "11.38", "9.23", "9.17", "(8.40)"],
  },
  {
    rank: 11,
    name: "Buyantogtokh Batsaikhan",
    best: "7.99",
    average: "10.00",
    country: "🇲🇳",
    solves: ["9.67", "10.35", "9.98", "(7.99)", "(11.59)"],
  },
  {
    rank: 12,
    name: "Altanbagana Altangerel",
    best: "10.00",
    average: "11.09",
    country: "🇲🇳",
    solves: ["(12.62)", "10.99", "10.85", "11.44", "(10.00)"],
  },
];

export default function Page({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <h1 className="text-2xl font-semibold mb-6 py-3 px-1">
        Тэмцээний үр дүн
      </h1>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden py-3 px-1">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Best
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Average
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Solves
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {SAMPLE_RESULTS.map((r) => (
                <tr key={r.rank} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {r.rank}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <a className="text-orange-600 hover:underline" href="#">
                      {r.name}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {r.best}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {r.average}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="flex flex-wrap gap-2">
                      {r.solves.map((s, i) => (
                        <span key={i} className="text-xs text-gray-600">
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Footer />
    </div>
  );
}
