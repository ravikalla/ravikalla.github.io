package in.ravikalla.json_compare;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import javax.xml.parsers.ParserConfigurationException;

import org.apache.log4j.Logger;
import org.xml.sax.SAXException;

import in.ravikalla.xml_compare.CompareXMLAndXML;
import in.ravikalla.xml_compare.dto.XMLToXMLComparisonResultsHolderDTO;
import in.ravikalla.xml_compare.util.CommonUtil;
import in.ravikalla.xml_compare.util.ConvertXMLToFullPathInCSV;
import in.ravikalla.xml_compare.util.XMLDataConverter;

/**
 * 
 * 
 * Compare two XMLs that has elements in random order and write differences in and Excel file.
 * 
 * @author ravi2523096@gmail.com
 * @since 31-May-2016
 * 
 * Current Features:
 * =================
 * 1. Compare XMLs with elements in any order
 * 2. Tested on 6MB XML files.
 * 3. Ignore elements while comparing
 * 4. Trim elements while comparing
 * 5. Auto identification of first level of repeating elements
 * 
 * TODO - New Features:
 * ================
 * 1. Consider prefix for elements
 * 2. Consider attributes
 * 3. Consider a primary key for repeating elements
 *
 * Compile with below command:
 * ===========================
 * $ java -jar xml-compare-0.0.1-SNAPSHOT-jar-with-dependencies.jar <Input XML1 path> <Input XML1 path> <Output XLS path>
 * Eg:
 * ===
 * $ java -jar xml-compare-0.0.1-SNAPSHOT-jar-with-dependencies.jar /home/ravi/Desktop/Projects/xml-compare/src/main/resources/XML1.xml /home/ravi/Desktop/Projects/xml-compare/src/main/resources/XML2.xml /home/ravi/Desktop/Projects/xml-compare/src/main/resources/Results2.xls
 * 
 * 
 * Docker:
 * =======
 * $ docker build -f Dockerfile -t ravikalla/xmlcompare .
 * $ docker run -p 8084:8080 -v <local path>:/usr/src -t ravikalla/xml-compare /usr/src/<XML1 in local path> /usr/src/<XML2 in local path> /usr/src/<Results.xls in <XML1 in local path>
 * $ docker run -p 8084:8080 -v /home/ravi/Desktop/Projects/xml-compare/src/main/resources:/usr/src -t ravikalla/xml-compare /usr/src/XML1.xml /usr/src/XML2.xml /usr/src/Results.xls
 */

public class CompareJSONAndJSON {
	private final static Logger logger = Logger.getLogger(CompareJSONAndJSON.class);

	public static void main(String[] args) {
		logger.debug("Start : CompareJSONAndJSON.main(...)");
		String strJSONFileName1 = "JSON1.json";
		String strJSONFileName2 = "JSON2.json";
		String strExcludeElementsFileName = null;
		String strIterateElementsFileName = null;
		String strComparisonResultsFile = "Results.xls";
		String strTrimElements = null;

		if (null != args && args.length >= 3) {
			strJSONFileName1 = args[0];
			strJSONFileName2 = args[1];
			strComparisonResultsFile = args[2];
		}
		try {
			testcompareJSONAndJSONWriteResults(strJSONFileName1, strJSONFileName2, strExcludeElementsFileName,
					strIterateElementsFileName, strComparisonResultsFile, strTrimElements);
		} catch (IOException e) {
			logger.error("31 : CompareJSONAndJSON.main(...) : IOException e : " + e);
		}
		logger.debug("End : CompareJSONAndJSON.main(...)");
	}

	public static boolean testcompareJSONAndJSONWriteResults(String strJSONFileName1, String strJSONFileName2,
			String strExcludeElementsFileName, String strIterateElementsFileName, String strComparisonResultsFile,
			String strTrimElements) throws IOException {
		logger.debug("Start : CompareJSONAndJSON.testcompareJSONAndJSONWriteResults()" + strJSONFileName1 + " : " + strJSONFileName2);
		String jsonStr1 = CommonUtil.readDataFromFile(strJSONFileName1);
		String jsonStr2 = CommonUtil.readDataFromFile(strJSONFileName2);
		List<String> lstElementsToExclude = CompareXMLAndXML.readTxtFileToList(strExcludeElementsFileName);
		List<String> lstIterativeElements = null;
		String strPrimaryNodeJSONElementName = null;
		if (null != strIterateElementsFileName)
			lstIterativeElements = CompareXMLAndXML.readTxtFileToList(strIterateElementsFileName);
		else
			lstIterativeElements = ConvertXMLToFullPathInCSV.getFirstLevelOfReapeatingElements(jsonStr1, jsonStr2);

		boolean testResult = CompareJSONAndJSON.compareJSONAndJSONWriteResults(
				strComparisonResultsFile, jsonStr1, jsonStr2,
				lstIterativeElements, lstElementsToExclude,
				strPrimaryNodeJSONElementName, strTrimElements
				);
		logger.debug("End : CompareJSONAndJSON.testcompareJSONAndJSONWriteResults()" + strJSONFileName1 + " : " + strJSONFileName2 + " : " + testResult);
		return testResult;
	}
	private static boolean compareJSONAndJSONWriteResults(String strComparisonResultsFile, String jsonStr1,
			String jsonStr2, List<String> lstIterativeElements, List<String> lstElementsToExclude,
			String strPrimaryNodeJSONElementName, String strTrimElements) {
		CompareXMLAndXML.printParametersOfComparison(strComparisonResultsFile, jsonStr1,
				jsonStr2, lstIterativeElements, lstElementsToExclude,
				strPrimaryNodeJSONElementName, strTrimElements);

		boolean blnDifferencesExists = false;

		try {
			logger.debug("Iterative elements length : " + lstIterativeElements.size());
			XMLToXMLComparisonResultsHolderDTO objXMLToXMLComparisonResultsHolderDTO = null;
			List<String> lstMatchedDataForCSV = new ArrayList<String>();
			List<String> lstMismatchedDataForCSV = new ArrayList<String>();
			lstMatchedDataForCSV.add("Expected XPath,Expected Data,Actual Data");
			lstMismatchedDataForCSV.add("Expected XPath,Expected Data,Actual Path,Actual Data");

			for (int intCtr = 0; intCtr < lstIterativeElements.size(); intCtr++) {
				String strIterationElement = lstIterativeElements.get(intCtr);
				if (!"".equals(strIterationElement)) {
					objXMLToXMLComparisonResultsHolderDTO = XMLDataConverter
							.compXPathEleDataWithChildEle(
									jsonStr1, jsonStr2,
									lstIterativeElements.get(intCtr),
									lstElementsToExclude,
									strPrimaryNodeJSONElementName,
									strTrimElements);
					lstMatchedDataForCSV.addAll(objXMLToXMLComparisonResultsHolderDTO.lstMatchedDataForCSV);
					lstMismatchedDataForCSV.addAll(objXMLToXMLComparisonResultsHolderDTO.lstMismatchedDataForCSV);
				}
			}
			logger.debug("Mismatched data size : " + lstMismatchedDataForCSV.size());
			if (lstMismatchedDataForCSV.size() > 1)
				blnDifferencesExists = true;
			XMLDataConverter.printResultsToFile(strComparisonResultsFile, lstMatchedDataForCSV, lstMismatchedDataForCSV);
		} catch (SAXException e) {
			logger.error("79 : CompareJSONAndJSON.compareJSONAndJSONWriteResults(...) : SAXException e : " + e);
		} catch (IOException e) {
			logger.error("81 : CompareJSONAndJSON.compareJSONAndJSONWriteResults(...) : IOException e : " + e);
		} catch (ParserConfigurationException e) {
			logger.error("83 : CompareJSONAndJSON.compareJSONAndJSONWriteResults(...) : ParserConfigurationException e : " + e);
		}
		return !blnDifferencesExists;
	}
}
