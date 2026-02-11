import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:diacritic/diacritic.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:web/web.dart' as web;
import 'package:flutter/foundation.dart';

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
  final String baseUri = kDebugMode 
      ? 'http://localhost:6969' 
      : web.window.location.origin;

  final url = Uri.parse('$baseUri/api/getDiscounts');
  final response = await http.get(url);

  if (response.statusCode == 200) {
    List<dynamic> body = jsonDecode(response.body);

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

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Akcijos',
      theme: ThemeData(
        colorScheme: .fromSeed(seedColor: Colors.deepPurple),
      ),
      home: const MyHomePage(title: 'Skibidi sigma akciju website'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});
  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  List<ProductAkcija> _allProducts = [];      // The "master" list
List<ProductAkcija> _filteredProducts = []; // The "visible" list
final TextEditingController _searchController = TextEditingController();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _getData();
  }

  void _runFilter(String enteredKeyword) {
    List<ProductAkcija> results = [];
    
    if (enteredKeyword.isEmpty) {
      results = _allProducts;
    } else {
      // Normalize the search keyword once
      String normalizedKeyword = removeDiacritics(enteredKeyword.toLowerCase());

      results = _allProducts.where((product) {
        // Normalize the product name for comparison
        String normalizedName = removeDiacritics(product.productName.toLowerCase());
        
        return normalizedName.contains(normalizedKeyword);
      }).toList();
    }

    setState(() {
      _filteredProducts = results;
    });
  }

  void _getData() async {
    setState(() => _isLoading = true);
    try {
      final products = await fetchProducts();
      setState(() {
        _allProducts = products;
        _filteredProducts = products; // Sync both on initial load
        _isLoading = false;
        _sortByPrice();
      });
    } catch (e) {
      print("Error: $e");
      setState(() => _isLoading = false);
    }
  }
  void _sortByPrice() {
    setState(() {
      _filteredProducts.sort((a, b) => a.costAfterDiscount.compareTo(b.costAfterDiscount));
    });
  }
  Widget _getShopLogo(String shopName) {
    String assetPath;
    
    // Normalize shop name to lowercase to avoid matching issues
    switch (shopName.toLowerCase()) {
      case 'rimi':
        assetPath = 'assets/images/rimiLogo.png';
        break;
      case 'maxima':
        assetPath = 'assets/images/maximaLogo.png';
        break;
      case 'iki':
        assetPath = 'assets/images/ikiLogo.png';
        break;
      case 'cia':
        assetPath = 'assets/images/ciaLogo.png';
        break;
      default:
        return const Icon(Icons.store, size: 24); // Fallback icon
    }

    return Image.asset(
      assetPath,
      width: 24,
      height: 24,
      errorBuilder: (context, error, stackTrace) => const Icon(Icons.image_not_supported, size: 24),
    );
  }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // appBar: AppBar(
      //   backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      //   title: Text(widget.title),
      //   actions: [
      //     IconButton(onPressed: _getData, icon: const Icon(Icons.refresh))
      //   ],
      // ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Stack(
              children: [
                // Layer 1: The Main Content
                Column(
                  children: [
                    // Spacing so the floating bar doesn't cover the header
                    const SizedBox(height: 70), 
                    
                    // Table Header
                    Container(
                      color: Colors.grey[200],
                      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
                      child: Row(
                        children: [
                          // 1. Matches the Shop Logo width (24)
                          const SizedBox(width: 24), 
                          
                          Expanded(
                            flex: 4, 
                            child: Padding(
                              // 2. Matches the 12.0 padding you added to the product name
                              padding: const EdgeInsets.symmetric(horizontal: 12.0), 
                              child: Text(
                                "Name (Found: ${_filteredProducts.length})", 
                                style: const TextStyle(fontWeight: FontWeight.bold)
                              ),
                            )
                          ),
                          const Expanded(flex: 1, child: Text("Before", style: TextStyle(fontWeight: FontWeight.bold))),
                          const Expanded(flex: 1, child: Text("After", style: TextStyle(fontWeight: FontWeight.bold))),
                          const Expanded(flex: 1, child: Text("Discount", style: TextStyle(fontWeight: FontWeight.bold))),
                        ],
                      ),
                    ),
                    // Product List
                    Expanded(
                      child: _filteredProducts.isEmpty
                          ? const Center(child: Text("No products found."))
                          : ListView.builder(
                              itemCount: _filteredProducts.length,
                              itemBuilder: (context, index) {
                                final item = _filteredProducts[index];
                                return Container(
                                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                                  decoration: BoxDecoration(
                                    border: Border(bottom: BorderSide(color: Colors.grey[300]!)),
                                    color: index.isEven ? Colors.white : Colors.grey[50],
                                  ),
                                  child: Row(
                                    children: [
                                      _getShopLogo(item.shopName.toLowerCase()),
                                      Expanded(
                                        flex: 4,
                                        child: Padding(
                                          padding: const EdgeInsets.symmetric(horizontal: 12.0),
                                            child: GestureDetector(
                                          onTap: () async {
                                            final String baseUri = kDebugMode 
                                              ? 'http://localhost:6969' 
                                              : web.window.location.origin;
                                            final url = Uri.parse('$baseUri/api/getImageByPageId?id=${item.pageId}');
                                            if (!await launchUrl(url)) {
                                              print('Could not launch $url');
                                            }
                                          },
                                          child: Text(
                                            item.productName,
                                            style: const TextStyle(
                                              color: Colors.blue, // Makes it look like a link
                                              decoration: TextDecoration.underline,
                                            ),
                                          ),
                                        ),
                                      )),
                                      Expanded(flex: 1, child: Text("${item.costBeforeDiscount == 0 ? "????" : "${item.costBeforeDiscount.toStringAsFixed(2)}€"}", style: TextStyle(
                                        color: item.costBeforeDiscount == 0 
                                            ? Colors.orangeAccent 
                                            : const Color.fromARGB(255, 0, 0, 0),
                                        fontWeight: item.costAfterDiscount == 0 ? FontWeight.bold : FontWeight.normal,
                                        ))
                                      ),
                                      Expanded(flex: 1, child: Text("${item.costAfterDiscount == 0 ? "????" : "${item.costAfterDiscount.toStringAsFixed(2)}€"}", style: TextStyle(
                                        color: item.costAfterDiscount == 0 
                                            ? Colors.orangeAccent 
                                            : const Color.fromARGB(255, 0, 0, 0),
                                        fontWeight: item.costAfterDiscount == 0 ? FontWeight.bold : FontWeight.normal,
                                        )),
                                      ),
                                      Expanded(flex: 1, child: Text(
                                          (item.discountSizeProc == 0 || item.discountSizeProc == 100)
                                              ? "????"
                                              : "${item.discountSizeProc.toStringAsFixed(0)}%",
                                          style: TextStyle(
                                            // Apply orange only if the value is 0 or 100
                                            color: (item.discountSizeProc == 0 || item.discountSizeProc == 100)
                                                ? Colors.orangeAccent
                                                : Colors.black,
                                            fontWeight: (item.discountSizeProc == 0 || item.discountSizeProc == 100)
                                                ? FontWeight.bold
                                                : FontWeight.normal,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                    ),
                  ],
                ),

                // Layer 2: The Floating Search Bar
                Positioned(
                  top: 10,
                  left: 15,
                  right: 15,
                  child: Material(
                    elevation: 8,
                    borderRadius: BorderRadius.circular(30),
                    child: TextField(
                      decoration: InputDecoration(
                        hintText: 'Search products...',
                        prefixIcon: const Icon(Icons.search),
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: const EdgeInsets.symmetric(vertical: 15),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(30),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      controller: _searchController,
                      onChanged: (value) => _runFilter(value),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}