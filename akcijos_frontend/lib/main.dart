import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class Magazine {
  final int? magazineId;
  final String name;
  final String shopName;
  final DateTime? endTime;
  final DateTime addedTime;
  final String url;

  Magazine({
    this.magazineId,
    required this.name,
    required this.shopName,
    this.endTime,
    required this.addedTime,
    required this.url,
  });

  factory Magazine.fromJson(Map<String, dynamic> json) => Magazine(
    magazineId: json['MagazineID'],
    name: json['Name'],
    shopName: json['ShopName'],
    endTime: json['EndTime'] != null ? DateTime.parse(json['EndTime']) : null,
    addedTime: DateTime.parse(json['AddedTime']),
    url: json['URL'],
  );

  Map<String, dynamic> toJson() => {
    'MagazineID': magazineId,
    'Name': name,
    'ShopName': shopName,
    'EndTime': endTime?.toIso8601String(),
    'AddedTime': addedTime.toIso8601String(),
    'URL': url,
  };
}

class Page {
  final int? pageId;
  final DateTime? endTime;
  final DateTime addedTime;
  final String imageUuid;
  final bool parsed;
  final int magazineId;

  Page({
    this.pageId,
    this.endTime,
    required this.addedTime,
    required this.imageUuid,
    required this.parsed,
    required this.magazineId,
  });

  factory Page.fromJson(Map<String, dynamic> json) => Page(
    pageId: json['PageId'],
    endTime: json['EndTime'] != null ? DateTime.parse(json['EndTime']) : null,
    addedTime: DateTime.parse(json['AddedTime']),
    imageUuid: json['ImageUUID'],
    parsed: json['Parsed'],
    magazineId: json['MagazineId'],
  );

  Map<String, dynamic> toJson() => {
    'PageId': pageId,
    'EndTime': endTime?.toIso8601String(),
    'AddedTime': addedTime.toIso8601String(),
    'ImageUUID': imageUuid,
    'Parsed': parsed,
    'MagazineId': magazineId,
  };
}

class ProductAkcija {
  final int? productId;
  final String productName;
  final String shopName;
  final double discountSizeProc; // Maps to number
  final double costBeforeDiscount;
  final double costAfterDiscount;
  final DateTime endTime;
  final DateTime addedTime;
  final int pageId;

  ProductAkcija({
    this.productId,
    required this.productName,
    required this.shopName,
    required this.discountSizeProc,
    required this.costBeforeDiscount,
    required this.costAfterDiscount,
    required this.endTime,
    required this.addedTime,
    required this.pageId,
  });

  factory ProductAkcija.fromJson(Map<String, dynamic> json) => ProductAkcija(
    productId: json['ProductId'],
    productName: json['ProductName'] ?? 'Unknown',
    shopName: json['ShopName'] ?? 'Unknown',
    // Use ?? 0.0 to handle nulls safely before calling .toDouble()
    discountSizeProc: (json['DiscountSizeProc'] ?? 0).toDouble(),
    costBeforeDiscount: (json['CostBeforeDiscount'] ?? 0).toDouble(),
    costAfterDiscount: (json['CostAfterDiscount'] ?? 0).toDouble(),
    endTime: DateTime.parse(
      json['EndTime'] ?? DateTime.now().toIso8601String(),
    ),
    addedTime: DateTime.parse(
      json['AddedTime'] ?? DateTime.now().toIso8601String(),
    ),
    pageId: json['PageId'] ?? 0,
  );

  Map<String, dynamic> toJson() => {
    'ProductId': productId,
    'ProductName': productName,
    'ShopName': shopName,
    'DiscountSizeProc': discountSizeProc,
    'CostBeforeDiscount': costBeforeDiscount,
    'CostAfterDiscount': costAfterDiscount,
    'EndTime': endTime.toIso8601String(),
    'AddedTime': addedTime.toIso8601String(),
    'PageId': pageId,
  };
}

class ProductDataSource extends DataTableSource {
  final List<ProductAkcija> products;

  ProductDataSource(this.products);

  @override
  DataRow? getRow(int index) {
    if (index >= products.length) return null;
    final item = products[index];

    return DataRow(cells: [
      DataCell(Text(item.productName)),
      DataCell(Text(item.costBeforeDiscount.toString())),
      DataCell(Text(item.costAfterDiscount.toString())),
      DataCell(Text(item.shopName)),
      DataCell(Text(item.discountSizeProc.toString()))
    ]);
  }

  @override
  bool get isRowCountApproximate => false;

  @override
  int get rowCount => products.length;

  @override
  int get selectedRowCount => 0;
}
Future<List<ProductAkcija>> fetchProducts() async {
  final url = Uri.parse('http://localhost:6969/api/getDiscounts');
  final response = await http.get(url);

  if (response.statusCode == 200) {
    // 1. Decode the string into a List
    List<dynamic> body = jsonDecode(response.body);

    // 2. Map each item in the list to a ProductAkcija object
    List<ProductAkcija> products = body
        .map((dynamic item) => ProductAkcija.fromJson(item))
        .toList();

    return products;
  } else {
    throw Exception('Failed to load products');
  }
}

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Akcijos',
      theme: ThemeData(
        // This is the theme of your application.
        //
        // TRY THIS: Try running your application with "flutter run". You'll see
        // the application has a purple toolbar. Then, without quitting the app,
        // try changing the seedColor in the colorScheme below to Colors.green
        // and then invoke "hot reload" (save your changes or press the "hot
        // reload" button in a Flutter-supported IDE, or press "r" if you used
        // the command line to start the app).
        //
        // Notice that the counter didn't reset back to zero; the application
        // state is not lost during the reload. To reset the state, use hot
        // restart instead.
        //
        // This works for code too, not just values: Most code changes can be
        // tested with just a hot reload.
        colorScheme: .fromSeed(seedColor: Colors.deepPurple),
      ),
      home: const MyHomePage(title: 'Flutter Demo Home Page'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});

  // This widget is the home page of your application. It is stateful, meaning
  // that it has a State object (defined below) that contains fields that affect
  // how it looks.

  // This class is the configuration for the state. It holds the values (in this
  // case the title) provided by the parent (in this case the App widget) and
  // used by the build method of the State. Fields in a Widget subclass are
  // always marked "final".

  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  // Store the actual list of products here
  List<ProductAkcija> _products = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _getData(); // Auto-fetch on start
  }

  void _getData() async {
    setState(() => _isLoading = true);
    try {
      final products = await fetchProducts();
      setState(() {
        _products = products;
        _isLoading = false;
      });
    } catch (e) {
      print("Error: $e");
      setState(() => _isLoading = false);
      // Optional: Show a snackbar error to the user
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: Text(widget.title),
        actions: [
          // Refresh button in the top bar
          IconButton(onPressed: _getData, icon: const Icon(Icons.refresh))
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator()) // Show loader
          : Column(
              children: [
                // 1. Fixed Header
                Container(
                  color: Colors.grey[200],
                  padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
                  child: const Row(
                    children: [
                      Expanded(flex: 2, child: Text("Name", style: TextStyle(fontWeight: FontWeight.bold))),
                      Expanded(flex: 1, child: Text("Before", style: TextStyle(fontWeight: FontWeight.bold))),
                      Expanded(flex: 1, child: Text("After", style: TextStyle(fontWeight: FontWeight.bold))),
                      Expanded(flex: 1, child: Text("Shop", style: TextStyle(fontWeight: FontWeight.bold))),
                      Expanded(flex: 1, child: Text("Discount size", style: TextStyle(fontWeight: FontWeight.bold))),
                    ],
                  ),
                ),

                // 2. High-Performance Scrolling List
                Expanded(
                  child: _products.isEmpty
                      ? const Center(child: Text("No products found."))
                      : ListView.builder(
                          itemCount: _products.length,
                          itemBuilder: (context, index) {
                            final item = _products[index];
                            return Container(
                              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                              decoration: BoxDecoration(
                                border: Border(bottom: BorderSide(color: Colors.grey[300]!)),
                                // Zebra stripes for readability
                                color: index.isEven ? Colors.white : Colors.grey[50],
                              ),
                              child: Row(
                                children: [
                                  Expanded(flex: 2, child: Text(item.productName)),
                                  Expanded(flex: 1, child: Text("${item.costBeforeDiscount}")),
                                  Expanded(flex: 1, child: Text("${item.costAfterDiscount}")),
                                  Expanded(flex: 1, child: Text(item.shopName)),
                                  Expanded(flex: 1, child: Text("${item.discountSizeProc}")),
                                ],
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
    );
  }
}
